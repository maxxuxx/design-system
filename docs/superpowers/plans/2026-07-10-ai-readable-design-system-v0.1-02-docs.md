# AI-Readable Design System v0.1 Docs and Browser QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Astro 7 static documentation platform, validate every MDX file, deterministically generate the component manifest, and provide reusable Windows Chromium route, accessibility, link, responsive, AI-artifact, and visual QA.

**Architecture:** `apps/docs` has three build-time content collections loaded with Astro's `glob()` loader: validated guides, validated Foundations, and validated component documents. Component MDX frontmatter is the single manifest source; a Node CLI reuses the same Zod schema and heading validator for deterministic `--write`, `--check`, and `--require-figma` modes. Astro prerenders collection entries through `entry.id` and the imported `render(entry)` function, while Playwright starts the production preview through `webServer.url` and shares route, axe, focus, overflow, link, and screenshot helpers across the final QA suites.

**Tech Stack:** Node.js 24.15.0, pnpm 11.11.0, TypeScript 7.0.2, Astro 7.0.7, `@astrojs/mdx` 7.0.2, `@astrojs/react` 6.0.1, Vitest 4.1.10, gray-matter 4.0.3, Playwright 1.61.1, `@axe-core/playwright` 4.12.1.

## Global Constraints

- The source of truth is `docs/superpowers/specs/2026-07-10-ai-readable-design-system-v0.1-design.md` plus the locked decisions in `docs/superpowers/plans/2026-07-10-ai-readable-design-system-v0.1.md`.
- Execute in the isolated `codex/design-system-v0.1` worktree created by `superpowers:using-git-worktrees`; never push while `gh repo view maxxuxx/design-system --json visibility` reports `PUBLIC`.
- Plan 01 must already provide `@maxxuxx/tokens/tokens.css`, `@maxxuxx/tokens/tokens.json`, and `apps/docs/public/design-system/tokens.json`. The JSON envelope is `{ schemaVersion: 1, tokens: ResolvedToken[] }` and contains exactly 106 entries.
- Plan 01 also owns the root and package manifests. This plan consumes package `@maxxuxx/docs` and does not rename or duplicate its scripts.
- Plan 03 owns the four React implementation bodies, the four component MDX bodies, `[data-component-demo="icon|badge|button|text-field"]`, and `component-slices.visual.spec.ts`. This plan does not implement those bodies and does not define that visual spec.
- This plan performs no Figma mutation. `--require-figma` only validates Figma URLs already written into component frontmatter by the coordinated Figma workflow.
- Every `.mdx` file under `apps/docs/src` must live in `src/content/guides`, `src/content/foundations`, or `src/content/components` and must be covered by a collection schema. Do not create loose page MDX.
- Use only `src/content.config.ts`, `glob()` from `astro/loaders`, `entry.id`, `getCollection()`, and imported `render(entry)`. Do not use `src/content/config.ts`, `entry.slug`, `entry.render()`, or `Astro.glob()`.
- The site is static, local-only, Korean-first, mobile-first, and trailing-slash canonical. Do not add hosting, an adapter, authentication, dark mode, publishing, or release automation.
- Site and React CSS consume semantic color variables only. Primitive values may be displayed as data inside Foundation visualizers, but site styles must not reference primitive color CSS variables.
- Navigation targets are at least 44px. The shell uses a disclosure navigation below 960px and a persistent 280px sidebar at 960px and above.
- Browser projects are Windows Chromium only with exact viewports: `mobile-chromium` 390x844, `tablet-chromium` 768x1024, and `desktop-chromium` 1440x900.
- Generate, review, and commit visual baselines on Windows with the installed Chromium version. Non-Windows visual tests skip with an explicit reason.
- Ordinary manifest write/check accepts an empty or partial component collection so vertical slices can land independently. `--require-figma` requires all four entries and non-empty Figma URLs.
- v0.1 component metadata is literal-only: component `status` and React are `preview`; Svelte and React Native are `planned`. `stable`, `deprecated`, and component-level `planned` are rejected.
- Generated `components.json` is committed and never hand-edited. `--check` never writes.

## Mandatory Execution Index

The physical sections below were assembled non-linearly. Workers MUST jump to and execute these exact anchors in this order; do not follow physical file order:

1. `### Task 1: Lock Astro 7 configuration and write failing content/manifest tests`
2. `### Task 2: Implement validated collections and deterministic manifest generation`
3. `### Task 3: Build the semantic-token responsive shell and validated guide/Foundation routes`
4. `### Task 4: Add reusable Playwright platform-route infrastructure`
5. Execute Plan 03 and the Figma URL workflow, then resume at `### Task 5: Complete final route, link, component-document, AI, accessibility, responsive, and visual QA`

Each task ends at the next `### Task` heading. This index overrides physical section order.

---

### Task 4: Add reusable Playwright platform-route infrastructure

**Files:**
- Create `apps/docs/playwright.config.ts`.
- Create `apps/docs/tests/e2e/support/routes.ts`.
- Create `apps/docs/tests/e2e/support/accessibility.ts`.
- Create `apps/docs/tests/e2e/support/visual.ts`.
- Create `apps/docs/tests/e2e/support/screenshot.css`.
- Create `apps/docs/tests/e2e/navigation.spec.ts` with platform-only smoke tests.

**Interfaces:**
- Produces the exact projects `mobile-chromium`, `tablet-chromium`, `desktop-chromium`.
- Produces `openHtmlRoute()`, `assertNoHorizontalOverflow()`, `assertSameOriginLinks()`, `assertNoAxeViolations()`, `expectVisibleFocus()`, `tabTo()`, `expectTabSequence()`, and `expectPageScreenshot()` for Plan 03 and Task 5.
- Uses `webServer.url`; never uses deprecated `webServer.port`.

- [ ] **Step 1: Configure Playwright production-preview startup and snapshot paths**

Create `apps/docs/playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/__snapshots__/{testFileBaseName}/{arg}{ext}',
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'mobile-chromium', use: { viewport: { width: 390, height: 844 } } },
    { name: 'tablet-chromium', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-chromium', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: 'pnpm run preview:e2e',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

- [ ] **Step 2: Add exact canonical-route, overflow, and same-origin-link helpers**

Create `apps/docs/tests/e2e/support/routes.ts`:

```ts
import {
  expect,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

export interface HtmlRoute {
  path: string;
  heading: string;
}

export const PLATFORM_HTML_ROUTES: readonly HtmlRoute[] = [
  { path: '/', heading: '사람과 AI가 함께 읽는 디자인 시스템' },
  { path: '/principles/', heading: '원칙' },
  { path: '/getting-started/', heading: 'Getting Started' },
  { path: '/foundations/colors/', heading: '색상' },
  { path: '/foundations/typography/', heading: '타이포그래피' },
  { path: '/foundations/spacing/', heading: '간격' },
  { path: '/foundations/radius/', heading: '모서리 반경' },
  { path: '/foundations/elevation/', heading: '고도' },
];

export const COMPONENT_HTML_ROUTES: readonly (HtmlRoute & { slug: string })[] = [
  { path: '/components/icon/', heading: 'Icon', slug: 'icon' },
  { path: '/components/badge/', heading: 'Badge', slug: 'badge' },
  { path: '/components/button/', heading: 'Button', slug: 'button' },
  { path: '/components/text-field/', heading: 'TextField', slug: 'text-field' },
];

export const CANONICAL_HTML_ROUTES = [
  ...PLATFORM_HTML_ROUTES,
  ...COMPONENT_HTML_ROUTES,
] as const;

export async function openHtmlRoute(page: Page, route: HtmlRoute): Promise<void> {
  const response = await page.goto(route.path, { waitUntil: 'networkidle' });
  expect(response, `${route.path} returned no main response`).not.toBeNull();
  expect(response!.status(), `${route.path} did not return 200`).toBe(200);
  await expect(page.getByRole('heading', {
    level: 1,
    name: route.heading,
    exact: true,
  })).toBeVisible();
}

export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
}

export async function assertSameOriginLinks(
  page: Page,
  request: APIRequestContext,
): Promise<void> {
  const current = new URL(page.url());
  const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
    anchors.map((anchor) => (anchor as HTMLAnchorElement).href));
  const links = [...new Set(hrefs
    .map((href) => new URL(href, current))
    .filter((url) => ['http:', 'https:'].includes(url.protocol) && url.origin === current.origin)
    .map((url) => url.href))].sort();

  for (const href of links) {
    const url = new URL(href);
    const withoutFragment = `${url.origin}${url.pathname}${url.search}`;
    const response = await request.get(withoutFragment);
    expect(response.ok(), `${href} returned ${response.status()}`).toBe(true);
    if (url.hash !== '') {
      const fragmentPage = await page.context().newPage();
      await fragmentPage.goto(withoutFragment, { waitUntil: 'domcontentloaded' });
      const id = decodeURIComponent(url.hash.slice(1));
      expect(await fragmentPage.evaluate((value) =>
        document.getElementById(value) !== null, id), `${href} has no fragment target`).toBe(true);
      await fragmentPage.close();
    }
  }
}
```

- [ ] **Step 3: Add reusable axe and keyboard-focus helpers**

Create `apps/docs/tests/e2e/support/accessibility.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

export async function assertNoAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
}

export async function expectVisibleFocus(locator: Locator): Promise<void> {
  await expect(locator).toBeFocused();
  const visible = await locator.evaluate((element) => {
    const style = getComputedStyle(element);
    const outline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
    const shadow = style.boxShadow !== 'none';
    return outline || shadow;
  });
  expect(visible).toBe(true);
}

export async function tabTo(
  page: Page,
  target: Locator,
  maximumTabs = 40,
): Promise<void> {
  for (let index = 0; index < maximumTabs; index += 1) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((element) => element === document.activeElement).catch(() => false)) {
      await expectVisibleFocus(target);
      return;
    }
  }
  throw new Error(`Target was not reached after ${maximumTabs} Tab presses.`);
}

export async function expectTabSequence(page: Page, targets: Locator[]): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (const target of targets) {
    await page.keyboard.press('Tab');
    await expectVisibleFocus(target);
  }
}
```

- [ ] **Step 4: Add deterministic screenshot helper and style**

Create `apps/docs/tests/e2e/support/visual.ts`:

```ts
import { expect, type Page, type TestInfo } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const screenshotStylePath = fileURLToPath(new URL('./screenshot.css', import.meta.url));

export async function prepareVisualPage(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

export async function expectPageScreenshot(
  page: Page,
  testInfo: TestInfo,
  name: string,
): Promise<void> {
  await prepareVisualPage(page);
  await expect(page).toHaveScreenshot(`${name}-${testInfo.project.name}.png`, {
    animations: 'disabled',
    caret: 'hide',
    fullPage: true,
    maxDiffPixelRatio: 0.01,
    stylePath: screenshotStylePath,
  });
}
```

Create `apps/docs/tests/e2e/support/screenshot.css`:

```css
html { scroll-behavior: auto !important; }
*, *::before, *::after {
  animation-delay: 0s !important;
  animation-duration: 0s !important;
  caret-color: transparent !important;
  transition-delay: 0s !important;
  transition-duration: 0s !important;
}
```

- [ ] **Step 5: Add platform-only route tests**

Create `apps/docs/tests/e2e/navigation.spec.ts`:

```ts
import { test } from '@playwright/test';
import {
  PLATFORM_HTML_ROUTES,
  assertNoHorizontalOverflow,
  openHtmlRoute,
} from './support/routes';

for (const route of PLATFORM_HTML_ROUTES) {
  test(`[platform] ${route.path} renders with no horizontal overflow`, async ({ page }) => {
    await openHtmlRoute(page, route);
    await assertNoHorizontalOverflow(page);
  });
}
```

- [ ] **Step 6: Run the production-preview platform suite**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs exec playwright install chromium
corepack pnpm --filter @maxxuxx/docs test:e2e -- --grep '\[platform\]'
```

Expected: the production build completes, Playwright waits on `http://127.0.0.1:4173` through `webServer.url`, and 24 tests pass: eight routes across three projects. The disclosure is visible in the 390px and 768px projects; the 280px sidebar is visible at 1440px.

- [ ] **Step 7: Commit reusable browser infrastructure**

```powershell
git add apps/docs/playwright.config.ts apps/docs/tests/e2e
git commit -m "test(docs): add browser QA infrastructure"
```

---

### Task 3: Build the semantic-token responsive shell and validated guide/Foundation routes

**Files:**
- Create every shell, visualizer, route, style, guide, and Foundation file listed in the Exact File Map.

**Interfaces:**
- Consumes `@maxxuxx/tokens/tokens.css` and `@maxxuxx/tokens/tokens.json` from Plan 01.
- Produces the eight platform HTML routes and a collection-driven component route ready for Plan 03 entries.
- Produces `ComponentPreview.astro` with a default stage slot and optional `controls` slot.

- [ ] **Step 1: Add navigation and token-data modules**

Create `apps/docs/src/navigation.ts`:

```ts
export interface NavigationItem {
  label: string;
  href: string;
}

export interface NavigationSection {
  label: string;
  items: NavigationItem[];
}

export const NAVIGATION: NavigationSection[] = [
  {
    label: '시작하기',
    items: [
      { label: '소개', href: '/' },
      { label: '원칙', href: '/principles/' },
      { label: 'Getting Started', href: '/getting-started/' },
    ],
  },
  {
    label: 'Foundations',
    items: [
      { label: '색상', href: '/foundations/colors/' },
      { label: '타이포그래피', href: '/foundations/typography/' },
      { label: '간격', href: '/foundations/spacing/' },
      { label: '모서리 반경', href: '/foundations/radius/' },
      { label: '고도', href: '/foundations/elevation/' },
    ],
  },
  {
    label: 'Components',
    items: [
      { label: 'Icon', href: '/components/icon/' },
      { label: 'Badge', href: '/components/badge/' },
      { label: 'Button', href: '/components/button/' },
      { label: 'TextField', href: '/components/text-field/' },
    ],
  },
];
```

Create `apps/docs/src/lib/token-data.ts`:

```ts
import artifact from '@maxxuxx/tokens/tokens.json';

export interface TokenRecord {
  name: string;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'shadow';
  kind: 'primitive' | 'semantic';
  value: string | number;
  description: string;
  cssVariable: `--ds-${string}`;
  resolvedValue: string | number;
}

if (artifact.schemaVersion !== 1 || !Array.isArray(artifact.tokens)) {
  throw new Error('Unsupported token artifact. Expected schemaVersion 1.');
}

export const tokens = artifact.tokens as TokenRecord[];

export function tokensByPrefix(prefix: string): TokenRecord[] {
  return tokens.filter(({ name }) => name.startsWith(prefix));
}

export function tokenByName(name: string): TokenRecord {
  const token = tokens.find((candidate) => candidate.name === name);
  if (!token) throw new Error(`Unknown token: ${name}`);
  return token;
}
```

- [ ] **Step 2: Add the exact layouts and navigation components**

Create `apps/docs/src/layouts/BaseLayout.astro`:

```astro
---
import '@maxxuxx/tokens/tokens.css';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = '사람과 AI가 함께 읽는 로컬 디자인 시스템 문서입니다.' } = Astro.props;
const documentTitle = title === 'AI-Readable Design System v0.1'
  ? title
  : `${title} | AI-Readable Design System v0.1`;
---

<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <title>{documentTitle}</title>
  </head>
  <body>
    <a class="skip-link" href="#main-content">본문으로 건너뛰기</a>
    <slot />
  </body>
</html>
```

Create `apps/docs/src/components/SideNavigation.astro`:

```astro
---
import { NAVIGATION } from '../navigation';

interface Props {
  currentPath: string;
  label?: string;
}

const { currentPath, label = '문서 탐색' } = Astro.props;
const isCurrent = (href: string) => href === '/'
  ? currentPath === '/'
  : currentPath.startsWith(href);
---

<nav class="side-navigation" aria-label={label} data-side-navigation>
  {NAVIGATION.map((section) => (
    <section class="navigation-section">
      <h2>{section.label}</h2>
      <ul>
        {section.items.map((item) => (
          <li>
            <a href={item.href} aria-current={isCurrent(item.href) ? 'page' : undefined}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  ))}
</nav>
```

Create `apps/docs/src/components/SiteHeader.astro`:

```astro
---
import SideNavigation from './SideNavigation.astro';

interface Props { currentPath: string }
const { currentPath } = Astro.props;
---

<header class="site-header">
  <a class="site-brand" href="/">AI-Readable DS</a>
  <details class="mobile-navigation">
    <summary>메뉴</summary>
    <div class="mobile-navigation-panel">
      <SideNavigation currentPath={currentPath} label="모바일 문서 탐색" />
    </div>
  </details>
</header>
```

Create `apps/docs/src/layouts/DocsLayout.astro`:

```astro
---
import BaseLayout from './BaseLayout.astro';
import SiteHeader from '../components/SiteHeader.astro';
import SideNavigation from '../components/SideNavigation.astro';
import '../styles/docs.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
const currentPath = Astro.url.pathname;
---

<BaseLayout title={title} description={description}>
  <SiteHeader currentPath={currentPath} />
  <div class="docs-grid">
    <aside class="desktop-sidebar">
      <SideNavigation currentPath={currentPath} />
    </aside>
    <main id="main-content" class="docs-main" tabindex="-1">
      <slot />
    </main>
  </div>
</BaseLayout>
```

Create `apps/docs/src/components/ComponentPreview.astro`:

```astro
---
interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<section class="component-preview" aria-label={title} data-component-preview>
  <div class="component-preview-copy">
    <h3>{title}</h3>
    {description && <p>{description}</p>}
  </div>
  <div class="component-preview-stage"><slot /></div>
  {Astro.slots.has('controls') && (
    <div class="component-preview-controls"><slot name="controls" /></div>
  )}
</section>
```

- [ ] **Step 3: Add Foundation visualizers backed by generated JSON**

Create `apps/docs/src/components/foundations/ColorGrid.astro`:

```astro
---
import { tokensByPrefix } from '../../lib/token-data';
interface Props { prefix: string }
const colorTokens = tokensByPrefix(Astro.props.prefix)
  .filter(({ type }) => type === 'color');
---
<div class="token-grid color-grid">
  {colorTokens.map((token) => (
    <article class="token-card">
      <div class="color-swatch" style={`background:${token.resolvedValue}`} aria-hidden="true"></div>
      <strong>{token.name}</strong>
      <code>{String(token.value)}</code>
      <p>{token.description}</p>
    </article>
  ))}
</div>
```

Create `apps/docs/src/components/foundations/TypeScale.astro`:

```astro
---
import { tokenByName, tokensByPrefix } from '../../lib/token-data';
const sizes = tokensByPrefix('font/size/');
---
<div class="specimen-list">
  {sizes.map((token) => {
    const key = token.name.replace('font/size/', '');
    const lineHeight = tokenByName(`font/line-height/${key}`);
    return (
      <article class="type-specimen">
        <p style={`font-size:${token.resolvedValue}px;line-height:${lineHeight.resolvedValue}px`}>
          읽기 쉬운 문장이 제품의 결정을 돕습니다.
        </p>
        <code>{token.name} · {token.resolvedValue}px / {lineHeight.resolvedValue}px</code>
      </article>
    );
  })}
</div>
```

Create `apps/docs/src/components/foundations/SpacingScale.astro`:

```astro
---
import { tokensByPrefix } from '../../lib/token-data';
const spaces = tokensByPrefix('space/');
---
<div class="specimen-list">
  {spaces.map((token) => (
    <article class="metric-row">
      <code>{token.name}</code>
      <div class="spacing-bar" style={`width:min(${Number(token.resolvedValue) * 4}px, 100%)`}></div>
      <span>{token.resolvedValue}px</span>
    </article>
  ))}
</div>
```

Create `apps/docs/src/components/foundations/RadiusScale.astro`:

```astro
---
import { tokensByPrefix } from '../../lib/token-data';
const radii = tokensByPrefix('radius/');
---
<div class="token-grid">
  {radii.map((token) => (
    <article class="token-card">
      <div class="radius-sample" style={`border-radius:${token.resolvedValue}px`}></div>
      <strong>{token.name}</strong>
      <code>{token.resolvedValue}px</code>
    </article>
  ))}
</div>
```

Create `apps/docs/src/components/foundations/ElevationScale.astro`:

```astro
---
import { tokensByPrefix } from '../../lib/token-data';
const elevations = tokensByPrefix('elevation/');
---
<div class="token-grid elevation-grid">
  {elevations.map((token) => (
    <article class="elevation-sample" style={`box-shadow:${token.resolvedValue}`}>
      <strong>{token.name}</strong>
      <code>{String(token.resolvedValue)}</code>
    </article>
  ))}
</div>
```

- [ ] **Step 4: Add complete semantic-only site styles**

Create `apps/docs/src/styles/global.css`:

```css
* { box-sizing: border-box; }
html { color-scheme: light; scroll-behavior: smooth; }
body {
  margin: 0;
  min-width: 320px;
  background: var(--ds-color-bg-canvas);
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-sans);
  font-size: var(--ds-font-size-body);
  line-height: var(--ds-font-line-height-body);
  text-rendering: optimizeLegibility;
}
a { color: var(--ds-color-action-primary); text-underline-offset: 3px; }
button, input, summary { font: inherit; }
:focus-visible {
  outline: 3px solid var(--ds-color-border-focus);
  outline-offset: 3px;
}
.skip-link {
  position: fixed;
  z-index: 100;
  top: 8px;
  left: 8px;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
  transform: translateY(-160%);
}
.skip-link:focus { transform: translateY(0); }
```

Create `apps/docs/src/styles/docs.css`:

```css
.site-header {
  position: sticky;
  z-index: 20;
  top: 0;
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-16);
  padding: 10px 16px;
  border-bottom: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
}
.site-brand {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-bold);
  text-decoration: none;
}
.mobile-navigation summary {
  display: flex;
  min-width: 64px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  list-style: none;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
}
.mobile-navigation summary::-webkit-details-marker { display: none; }
.mobile-navigation-panel {
  position: absolute;
  top: 64px;
  right: 0;
  left: 0;
  max-height: calc(100vh - 64px);
  overflow: auto;
  padding: 16px;
  border-bottom: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
}
.docs-grid { min-height: calc(100vh - 64px); }
.desktop-sidebar { display: none; }
.docs-main {
  width: min(calc(100% - 32px), 840px);
  margin: 0 auto;
  padding: 40px 0 64px;
}
.side-navigation { display: grid; gap: 24px; }
.navigation-section h2 {
  margin: 0 0 8px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-caption);
  line-height: var(--ds-font-line-height-caption);
  text-transform: uppercase;
}
.navigation-section ul { display: grid; gap: 2px; margin: 0; padding: 0; list-style: none; }
.navigation-section a {
  display: flex;
  min-height: 44px;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-secondary);
  text-decoration: none;
}
.navigation-section a:hover { background: var(--ds-color-bg-subtle); color: var(--ds-color-text-primary); }
.navigation-section a[aria-current='page'] {
  background: var(--ds-color-action-weak);
  color: var(--ds-color-action-on-weak);
  font-weight: var(--ds-font-weight-semibold);
}
.eyebrow { color: var(--ds-color-action-primary); font-weight: var(--ds-font-weight-semibold); }
h1, h2, h3 { color: var(--ds-color-text-primary); letter-spacing: -0.02em; }
h1 { margin: 0 0 16px; font-size: clamp(32px, 8vw, 48px); line-height: 1.15; }
h2 { margin: 48px 0 16px; font-size: var(--ds-font-size-title); line-height: var(--ds-font-line-height-title); }
h3 { font-size: var(--ds-font-size-title-sm); line-height: var(--ds-font-line-height-title-sm); }
p, li { max-width: 72ch; }
pre { overflow-x: auto; padding: 16px; border-radius: var(--ds-radius-lg); background: var(--ds-color-bg-subtle); }
code { overflow-wrap: anywhere; }
.hero { padding: 24px 0 40px; }
.hero > p { color: var(--ds-color-text-secondary); font-size: var(--ds-font-size-body-lg); line-height: var(--ds-font-line-height-body-lg); }
.primary-link {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  margin-top: 16px;
  padding: 10px 18px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-action-primary);
  color: var(--ds-color-action-on-primary);
  font-weight: var(--ds-font-weight-semibold);
  text-decoration: none;
}
.link-grid, .token-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
.link-card, .token-card, .component-preview, .elevation-sample {
  padding: 20px;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
}
.link-card { color: inherit; text-decoration: none; }
.link-card strong { display: block; margin-bottom: 4px; }
.link-card span, .token-card p { color: var(--ds-color-text-secondary); }
.component-preview { margin: 24px 0; }
.component-preview-copy h3, .component-preview-copy p { margin-top: 0; }
.component-preview-stage { display: grid; min-height: 160px; place-items: center; padding: 24px; background: var(--ds-color-bg-subtle); border-radius: var(--ds-radius-md); }
.component-preview-controls { padding-top: 16px; }
.color-swatch { height: 96px; margin: -12px -12px 16px; border: 1px solid var(--ds-color-border-default); border-radius: var(--ds-radius-md); }
.specimen-list { display: grid; gap: 16px; }
.type-specimen, .metric-row { padding: 16px; border-bottom: 1px solid var(--ds-color-border-default); }
.type-specimen p { margin: 0 0 8px; }
.metric-row { display: grid; grid-template-columns: minmax(100px, 1fr) 2fr auto; align-items: center; gap: 16px; }
.spacing-bar { min-width: 2px; height: 16px; background: var(--ds-color-action-primary); border-radius: var(--ds-radius-sm); }
.radius-sample { width: 100%; height: 96px; margin-bottom: 16px; border: 2px solid var(--ds-color-action-primary); background: var(--ds-color-action-weak); }
.elevation-sample { min-height: 160px; }
.elevation-sample code { display: block; margin-top: 24px; color: var(--ds-color-text-secondary); }
.page-description { color: var(--ds-color-text-secondary); font-size: var(--ds-font-size-body-lg); line-height: var(--ds-font-line-height-body-lg); }
.status-chip { display: inline-flex; padding: 4px 10px; border-radius: var(--ds-radius-full); background: var(--ds-color-action-weak); color: var(--ds-color-action-on-weak); }
@media (min-width: 960px) {
  .site-header { padding-right: 32px; padding-left: 32px; }
  .mobile-navigation { display: none; }
  .docs-grid { display: grid; grid-template-columns: 280px minmax(0, 1fr); }
  .desktop-sidebar {
    position: sticky;
    top: 64px;
    display: block;
    height: calc(100vh - 64px);
    overflow: auto;
    padding: 32px 24px;
    border-right: 1px solid var(--ds-color-border-default);
    background: var(--ds-color-bg-surface);
  }
  .docs-main { width: min(calc(100% - 64px), 920px); padding: 64px 0 96px; }
  .hero { padding-top: 48px; }
}
```

- [ ] **Step 5: Add complete collection-driven routes**

Create `apps/docs/src/pages/[guide].astro`:

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import DocsLayout from '../layouts/DocsLayout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('guides');
  return entries.map((entry) => {
    if (entry.id !== entry.data.slug) throw new Error(`Guide id ${entry.id} must match slug ${entry.data.slug}`);
    return { params: { guide: entry.id }, props: { entry } };
  });
}

interface Props { entry: CollectionEntry<'guides'> }
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<DocsLayout title={entry.data.title} description={entry.data.description}>
  <h1>{entry.data.title}</h1>
  <p class="page-description">{entry.data.description}</p>
  <Content />
</DocsLayout>
```

Create `apps/docs/src/pages/foundations/[...id].astro`:

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import DocsLayout from '../../layouts/DocsLayout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('foundations');
  return entries.map((entry) => {
    if (entry.id !== entry.data.slug) throw new Error(`Foundation id ${entry.id} must match slug ${entry.data.slug}`);
    return { params: { id: entry.id }, props: { entry } };
  });
}

interface Props { entry: CollectionEntry<'foundations'> }
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<DocsLayout title={entry.data.title} description={entry.data.description}>
  <h1>{entry.data.title}</h1>
  <p class="page-description">{entry.data.description}</p>
  <Content />
</DocsLayout>
```

Create `apps/docs/src/pages/components/[...id].astro`:

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import DocsLayout from '../../layouts/DocsLayout.astro';

export async function getStaticPaths() {
  const entries = await getCollection('components');
  return entries.map((entry) => {
    if (entry.id !== entry.data.slug) throw new Error(`Component id ${entry.id} must match slug ${entry.data.slug}`);
    return { params: { id: entry.id }, props: { entry } };
  });
}

interface Props { entry: CollectionEntry<'components'> }
const { entry } = Astro.props;
const { Content } = await render(entry);
---
<DocsLayout title={entry.data.name} description={entry.data.description}>
  <span class="status-chip">{entry.data.status}</span>
  <h1>{entry.data.name}</h1>
  <p class="page-description">{entry.data.description}</p>
  <Content />
</DocsLayout>
```

Create `apps/docs/src/pages/index.astro`:

```astro
---
import DocsLayout from '../layouts/DocsLayout.astro';
---
<DocsLayout title="AI-Readable Design System v0.1">
  <section class="hero">
    <span class="eyebrow">v0.1 · Local preview</span>
    <h1>사람과 AI가 함께 읽는 디자인 시스템</h1>
    <p>토큰, 원칙, React 파일럿 계약을 정적 문서와 JSON으로 같은 이름 아래 연결합니다.</p>
    <a class="primary-link" href="/getting-started/">Getting Started</a>
  </section>
  <section aria-labelledby="explore-title">
    <h2 id="explore-title">탐색하기</h2>
    <div class="link-grid">
      <a class="link-card" href="/principles/"><strong>원칙</strong><span>제품 전반의 판단 기준</span></a>
      <a class="link-card" href="/foundations/colors/"><strong>Foundations</strong><span>색상, 글자, 간격, 반경, 고도</span></a>
      <a class="link-card" href="/components/button/"><strong>Components</strong><span>Icon, Badge, Button, TextField</span></a>
    </div>
  </section>
</DocsLayout>
```

- [ ] **Step 6: Add validated guide MDX with complete copy**

Create `apps/docs/src/content/guides/principles.mdx`:

```mdx
---
slug: principles
title: 원칙
description: 제품 화면과 컴포넌트를 일관되게 판단하는 다섯 가지 기준입니다.
order: 1
---

## 먼저 이해되어야 합니다

작은 화면에서도 제목, 설명, 다음 행동의 순서가 즉시 보여야 합니다. 장식보다 정보 위계를 먼저 설계합니다.

## 한 화면의 주 행동은 하나입니다

가장 중요한 행동만 강하게 표시하고 보조 행동은 시각적 무게를 낮춥니다.

## 의미 토큰으로 표현합니다

제품 UI는 원시 색상 값이 아니라 `color/action/primary`, `color/text/secondary`처럼 역할을 말하는 토큰을 사용합니다.

## 기본 웹 의미를 보존합니다

버튼은 `button`, 입력은 `input`을 사용합니다. 키보드, 초점, 이름, 오류 연결은 시각 스타일과 같은 수준의 계약입니다.

## 플랫폼 차이는 실제 차이만 기록합니다

React와 Svelte는 같은 웹 계약을 공유합니다. React Native에서 동작이나 표현이 실제로 달라질 때만 차이를 추가합니다.
```

Create `apps/docs/src/content/guides/getting-started.mdx`:

```mdx
---
slug: getting-started
title: Getting Started
description: 로컬 문서와 AI 산출물을 확인하는 가장 짧은 시작 경로입니다.
order: 2
---

## 현재 배포 상태

v0.1은 로컬 검증용이며 npm으로 설치할 수 없습니다. 저장소의 pnpm workspace 안에서만 사용합니다.

## 문서 실행

```powershell
corepack pnpm install
corepack pnpm --filter @maxxuxx/docs dev
```

개발 서버가 출력한 로컬 URL에서 문서를 탐색합니다.

## 정적 빌드

```powershell
corepack pnpm --filter @maxxuxx/docs build
```

결과는 `apps/docs/dist`에 생성됩니다. 정적 HTML과 `/design-system/tokens.json`, `/design-system/components.json`이 함께 있어야 합니다.

## AI가 읽을 경로

- 토큰: `/design-system/tokens.json`
- 컴포넌트 manifest: `/design-system/components.json`
- 원본 설명: `apps/docs/src/content`
- React 계약: `packages/react/src`
```

- [ ] **Step 7: Add all five validated Foundation MDX files**

Create `apps/docs/src/content/foundations/colors.mdx`:

```mdx
---
slug: colors
title: 색상
description: Primitive 색상과 제품 역할을 설명하는 Semantic 색상을 분리합니다.
order: 1
tokenPrefixes: [color/]
---
import ColorGrid from '../../components/foundations/ColorGrid.astro';

## 목적

Primitive는 실제 팔레트 값이고 Semantic은 배경, 텍스트, 행동, 상태의 역할입니다. 제품 UI는 Semantic 색상만 사용합니다.

## 사용 문법

```css
color: var(--ds-color-text-primary);
background: var(--ds-color-bg-surface);
```

## 생성된 값

<ColorGrid prefix="color/" />
```

Create `apps/docs/src/content/foundations/typography.mdx`:

```mdx
---
slug: typography
title: 타이포그래피
description: 시스템 글꼴과 크기·행간·굵기 토큰으로 읽기 위계를 만듭니다.
order: 2
tokenPrefixes: [font/]
---
import TypeScale from '../../components/foundations/TypeScale.astro';

## 목적

v0.1은 `font/family/sans` 시스템 스택을 사용합니다. 크기와 행간은 같은 이름의 단계로 조합하고, 굵기는 의미 있는 위계에만 사용합니다.

## 사용 문법

```css
font-family: var(--ds-font-family-sans);
font-size: var(--ds-font-size-body);
line-height: var(--ds-font-line-height-body);
```

## 생성된 스케일

<TypeScale />
```

Create `apps/docs/src/content/foundations/spacing.mdx`:

```mdx
---
slug: spacing
title: 간격
description: 2px에서 64px까지의 제한된 스케일로 리듬과 그룹을 표현합니다.
order: 3
tokenPrefixes: [space/, size/]
---
import SpacingScale from '../../components/foundations/SpacingScale.astro';

## 목적

간격은 가까운 정보와 분리된 정보를 설명합니다. 임의의 숫자 대신 `space/*`를 사용하고, 터치 컨트롤 높이는 `size/control/*`를 사용합니다.

## 사용 문법

```css
gap: var(--ds-space-16);
min-height: var(--ds-size-control-medium);
```

## 생성된 스케일

<SpacingScale />
```

Create `apps/docs/src/content/foundations/radius.mdx`:

```mdx
---
slug: radius
title: 모서리 반경
description: 요소의 크기와 역할에 맞는 제한된 반경 단계를 사용합니다.
order: 4
tokenPrefixes: [radius/]
---
import RadiusScale from '../../components/foundations/RadiusScale.astro';

## 목적

반경은 브랜드 장식이 아니라 요소의 형태와 상호작용 범위를 명확히 하는 데 사용합니다. 배지처럼 완전히 둥근 요소만 `radius/full`을 사용합니다.

## 사용 문법

```css
border-radius: var(--ds-radius-md);
```

## 생성된 스케일

<RadiusScale />
```

Create `apps/docs/src/content/foundations/elevation.mdx`:

```mdx
---
slug: elevation
title: 고도
description: 겹침과 떠 있는 계층을 설명할 때만 두 단계 그림자를 사용합니다.
order: 5
tokenPrefixes: [elevation/]
---
import ElevationScale from '../../components/foundations/ElevationScale.astro';

## 목적

고도는 메뉴, 팝오버처럼 실제로 겹치는 계층을 설명합니다. 일반 카드 구분에는 우선 배경과 border를 사용합니다.

## 사용 문법

```css
box-shadow: var(--ds-elevation-1);
```

## 생성된 단계

<ElevationScale />
```

- [ ] **Step 8: Run schema, manifest, Astro, and output checks**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs test:unit
corepack pnpm --filter @maxxuxx/docs check
corepack pnpm --filter @maxxuxx/docs build
$required = @(
  'apps/docs/dist/index.html',
  'apps/docs/dist/principles/index.html',
  'apps/docs/dist/getting-started/index.html',
  'apps/docs/dist/foundations/colors/index.html',
  'apps/docs/dist/foundations/typography/index.html',
  'apps/docs/dist/foundations/spacing/index.html',
  'apps/docs/dist/foundations/radius/index.html',
  'apps/docs/dist/foundations/elevation/index.html',
  'apps/docs/dist/design-system/tokens.json',
  'apps/docs/dist/design-system/components.json'
)
$missing = $required | Where-Object { -not (Test-Path $_) }
if ($missing) { throw "Missing outputs: $($missing -join ', ')" }
```

Expected: tests, `astro check`, and static build PASS; `$missing` is empty; `components.json` still has an empty array. No component route is expected until Plan 03 creates its MDX entry.

- [ ] **Step 9: Commit the docs shell and platform content**

```powershell
git add apps/docs/src apps/docs/public/design-system/components.json
git commit -m "feat(docs): add responsive static documentation shell"
```

---

## Dependency and Execution Order

1. Complete Plan 01 and verify the token JSON/CSS artifacts.
2. Execute Tasks 1-4 below. The result is a passing static docs platform and platform-route browser suite with an empty component manifest.
3. Execute Plan 03 component slices and the separate Figma coordination workflow. Component MDX must follow the schema and helper contracts defined here.
4. Resume this plan at Task 5 to add and run final component-route, AI-artifact, accessibility, link, responsive, and full-page visual QA.

## Exact File Map

### Content pipeline and platform

- Create `apps/docs/astro.config.mjs`.
- Create `apps/docs/tsconfig.json`.
- Create `apps/docs/vitest.config.ts`.
- Create `apps/docs/src/content.config.ts`.
- Create `apps/docs/src/content/page-schema.ts`.
- Create `apps/docs/src/content/component-schema.ts`.
- Create `apps/docs/src/content/components/.gitkeep` as a zero-byte file.
- Create `apps/docs/scripts/validate-component-template.ts`.
- Create `apps/docs/scripts/component-manifest.ts`.
- Create `apps/docs/tests/unit/content.test.ts`.
- Create `apps/docs/tests/unit/manifest.test.ts`.
- Generate `apps/docs/public/design-system/components.json`.

### Shell, routes, and content

- Create `apps/docs/src/navigation.ts`.
- Create `apps/docs/src/lib/token-data.ts`.
- Create `apps/docs/src/layouts/BaseLayout.astro`.
- Create `apps/docs/src/layouts/DocsLayout.astro`.
- Create `apps/docs/src/components/SiteHeader.astro`.
- Create `apps/docs/src/components/SideNavigation.astro`.
- Create `apps/docs/src/components/ComponentPreview.astro`.
- Create `apps/docs/src/components/foundations/ColorGrid.astro`.
- Create `apps/docs/src/components/foundations/TypeScale.astro`.
- Create `apps/docs/src/components/foundations/SpacingScale.astro`.
- Create `apps/docs/src/components/foundations/RadiusScale.astro`.
- Create `apps/docs/src/components/foundations/ElevationScale.astro`.
- Create `apps/docs/src/styles/global.css`.
- Create `apps/docs/src/styles/docs.css`.
- Create `apps/docs/src/pages/index.astro`.
- Create `apps/docs/src/pages/[guide].astro`.
- Create `apps/docs/src/pages/foundations/[...id].astro`.
- Create `apps/docs/src/pages/components/[...id].astro`.
- Create `apps/docs/src/content/guides/principles.mdx`.
- Create `apps/docs/src/content/guides/getting-started.mdx`.
- Create `apps/docs/src/content/foundations/colors.mdx`.
- Create `apps/docs/src/content/foundations/typography.mdx`.
- Create `apps/docs/src/content/foundations/spacing.mdx`.
- Create `apps/docs/src/content/foundations/radius.mdx`.
- Create `apps/docs/src/content/foundations/elevation.mdx`.

### Browser QA

- Create `apps/docs/playwright.config.ts`.
- Create `apps/docs/tests/e2e/support/routes.ts`.
- Create `apps/docs/tests/e2e/support/accessibility.ts`.
- Create `apps/docs/tests/e2e/support/visual.ts`.
- Create `apps/docs/tests/e2e/support/screenshot.css`.
- Create, then extend, `apps/docs/tests/e2e/navigation.spec.ts`.
- Create after Plan 03 `apps/docs/tests/e2e/components.spec.ts`.
- Create after Plan 03 and Figma URL population `apps/docs/tests/e2e/ai-artifacts.spec.ts`.
- Create after Plan 03 `apps/docs/tests/e2e/accessibility.spec.ts`.
- Create after Plan 03 `apps/docs/tests/e2e/visual.spec.ts`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/home-mobile-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/home-tablet-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/home-desktop-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/foundations-colors-mobile-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/foundations-colors-tablet-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/foundations-colors-desktop-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/button-mobile-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/button-tablet-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/button-desktop-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/text-field-mobile-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/text-field-tablet-chromium.png`.
- Generate `apps/docs/tests/e2e/__snapshots__/visual.spec/text-field-desktop-chromium.png`.

---

### Task 1: Lock Astro 7 configuration and write failing content/manifest tests

**Files:**
- Create `apps/docs/astro.config.mjs`.
- Create `apps/docs/tsconfig.json`.
- Create `apps/docs/vitest.config.ts`.
- Create `apps/docs/tests/unit/content.test.ts`.
- Create `apps/docs/tests/unit/manifest.test.ts`.

**Interfaces:**
- Consumes the Plan 01 `@maxxuxx/docs` manifest and token package.
- Establishes unit tests that import the schemas, heading validator, and manifest functions implemented in Task 2.

- [ ] **Step 1: Verify the package scripts inherited from Plan 01**

Run:

```powershell
node -e "const p=require('./apps/docs/package.json'); const expected=['dev','check','test','test:unit','manifest:write','manifest:check','manifest:release-check','build','preview','preview:e2e','test:e2e']; if(p.name!=='@maxxuxx/docs'||expected.some(k=>!p.scripts[k])) process.exit(1)"
```

Expected: exit 0. The exact scripts remain:

```json
{
  "dev": "pnpm --filter @maxxuxx/tokens tokens:generate && astro dev",
  "check": "astro check",
  "test": "vitest run",
  "test:unit": "vitest run",
  "manifest:write": "tsx scripts/component-manifest.ts --write",
  "manifest:check": "tsx scripts/component-manifest.ts --check",
  "manifest:release-check": "tsx scripts/component-manifest.ts --check --require-figma",
  "build": "pnpm --filter @maxxuxx/tokens generated:check && pnpm manifest:check && astro check && astro build",
  "preview": "astro preview",
  "preview:e2e": "pnpm run build && astro preview --host 127.0.0.1 --port 4173",
  "test:e2e": "playwright test"
}
```

- [ ] **Step 2: Add the current Astro and isolated Vitest configurations**

Create `apps/docs/astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  trailingSlash: 'always',
  server: { host: false },
  integrations: [react(), mdx()],
});
```

Create `apps/docs/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true
  }
}
```

Create `apps/docs/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: Write the failing content/schema/template test**

Create `apps/docs/tests/unit/content.test.ts`:

```ts
import { readdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_NAMES,
  componentSchema,
} from '../../src/content/component-schema';
import {
  foundationSchema,
  guideSchema,
} from '../../src/content/page-schema';
import {
  REQUIRED_COMPONENT_HEADINGS,
  extractSecondLevelHeadings,
  validateComponentTemplate,
} from '../../scripts/validate-component-template';

const srcRoot = fileURLToPath(new URL('../../src/', import.meta.url));

async function listMdxFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return listMdxFiles(path);
    return entry.isFile() && entry.name.endsWith('.mdx') ? [path] : [];
  }));
  return nested.flat().sort();
}

function validComponent() {
  return {
    name: 'Button',
    slug: 'button',
    description: '주요 행동을 실행합니다.',
    status: 'preview',
    figmaUrl: '',
    frameworks: {
      react: 'preview',
      svelte: 'planned',
      reactNative: 'planned',
    },
    variants: ['fill', 'weak', 'outline'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'pressed', 'disabled', 'loading'],
    accessibility: '기본 button 의미와 키보드 동작을 유지합니다.',
    props: [{
      name: 'size',
      type: "'small' | 'medium' | 'large'",
      required: false,
      defaultValue: 'medium',
      description: '버튼 높이를 정합니다.',
    }],
    tokens: ['color/action/primary'],
  };
}

describe('MDX collection coverage', () => {
  it('keeps every MDX file inside a validated collection and validates it', async () => {
    const files = await listMdxFiles(srcRoot);
    const allowedFiles = new Set([
      'content/guides/getting-started.mdx',
      'content/guides/principles.mdx',
      'content/foundations/colors.mdx',
      'content/foundations/elevation.mdx',
      'content/foundations/radius.mdx',
      'content/foundations/spacing.mdx',
      'content/foundations/typography.mdx',
      'content/components/icon.mdx',
      'content/components/badge.mdx',
      'content/components/button.mdx',
      'content/components/text-field.mdx',
    ]);

    for (const file of files) {
      const normalized = relative(srcRoot, file).replaceAll('\\', '/');
      expect(allowedFiles.has(normalized), `${normalized} is not collection-backed`).toBe(true);
      const source = await readFile(file, 'utf8');
      const parsed = matter(source);
      if (normalized.startsWith('content/guides/')) guideSchema.parse(parsed.data);
      if (normalized.startsWith('content/foundations/')) foundationSchema.parse(parsed.data);
      if (normalized.startsWith('content/components/')) {
        componentSchema.parse(parsed.data);
        validateComponentTemplate(parsed.content, file);
      }
    }
  });

  it('has both guides and all five Foundation documents', async () => {
    const files = (await listMdxFiles(srcRoot))
      .map((file) => relative(srcRoot, file).replaceAll('\\', '/'));
    expect(files).toEqual(expect.arrayContaining([
      'content/guides/getting-started.mdx',
      'content/guides/principles.mdx',
      'content/foundations/colors.mdx',
      'content/foundations/elevation.mdx',
      'content/foundations/radius.mdx',
      'content/foundations/spacing.mdx',
      'content/foundations/typography.mdx',
    ]));
  });
});

describe('component metadata contract', () => {
  it('locks the four component names', () => {
    expect(COMPONENT_NAMES).toEqual(['Icon', 'Badge', 'Button', 'TextField']);
  });

  it('rejects a preview component whose React state is stable', () => {
    const value = validComponent();
    value.frameworks.react = 'stable';
    const result = componentSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['frameworks', 'react']);
  });

  it('rejects stable component status because v0.1 is preview-only', () => {
    const value = validComponent();
    value.status = 'stable';
    const result = componentSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['status']);
  });

  it('rejects a wrong name and slug pair', () => {
    const value = validComponent();
    value.slug = 'badge';
    expect(() => componentSchema.parse(value)).toThrow('Button must use slug button');
  });
});

describe('component heading contract', () => {
  it('ignores H2-looking lines inside fenced code and JSX', () => {
    const source = [
      '```md',
      '## 코드 안 제목',
      '```',
      '<ComponentPreview>',
      '## JSX 안 제목',
      '</ComponentPreview>',
      ...REQUIRED_COMPONENT_HEADINGS.map((heading) => `## ${heading}`),
    ].join('\n');
    expect(extractSecondLevelHeadings(source)).toEqual(REQUIRED_COMPONENT_HEADINGS);
  });

  it('reports the exact first heading-order mismatch', () => {
    const headings = [...REQUIRED_COMPONENT_HEADINGS];
    [headings[0], headings[1]] = [headings[1]!, headings[0]!];
    expect(() => validateComponentTemplate(
      headings.map((heading) => `## ${heading}`).join('\n'),
      'button.mdx',
    )).toThrow('button.mdx: component heading 1 expected "예제" but found "사용해야 할 때".');
  });

  it('reports a missing final heading', () => {
    const source = REQUIRED_COMPONENT_HEADINGS
      .slice(0, -1)
      .map((heading) => `## ${heading}`)
      .join('\n');
    expect(() => validateComponentTemplate(source, 'button.mdx'))
      .toThrow('button.mdx: component heading 13 expected "지원 상태" but found "<missing>".');
  });
});
```

- [ ] **Step 4: Write the failing manifest tests**

Create `apps/docs/tests/unit/manifest.test.ts`:

```ts
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { ComponentMetadata } from '../../src/content/component-schema';
import {
  applyManifestMode,
  buildComponentManifest,
  renderComponentManifest,
  type ComponentDocument,
} from '../../scripts/component-manifest';
import { REQUIRED_COMPONENT_HEADINGS } from '../../scripts/validate-component-template';

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })));
});

function metadata(name: ComponentMetadata['name'], figmaUrl = ''): ComponentMetadata {
  const slugByName = {
    Icon: 'icon',
    Badge: 'badge',
    Button: 'button',
    TextField: 'text-field',
  } as const;
  return {
    name,
    slug: slugByName[name],
    description: `${name} 목적`,
    status: 'preview',
    figmaUrl,
    frameworks: { react: 'preview', svelte: 'planned', reactNative: 'planned' },
    variants: [],
    sizes: [],
    states: ['default'],
    accessibility: `${name} 접근성 계약`,
    props: [],
    tokens: ['color/text/primary'],
  };
}

function document(name: ComponentMetadata['name'], figmaUrl = ''): ComponentDocument {
  const data = metadata(name, figmaUrl);
  return {
    filePath: `/repo/apps/docs/src/content/components/${data.slug}.mdx`,
    data,
    body: REQUIRED_COMPONENT_HEADINGS.map((heading) => `## ${heading}`).join('\n'),
  };
}

describe('component manifest', () => {
  it('allows a valid empty collection for the docs-platform commit', () => {
    expect(buildComponentManifest([])).toEqual({ schemaVersion: 1, components: [] });
  });

  it('sorts entries Icon, Badge, Button, TextField regardless of file order', () => {
    const manifest = buildComponentManifest([
      document('TextField'),
      document('Button'),
      document('Badge'),
      document('Icon'),
    ]);
    expect(manifest.components.map(({ name }) => name))
      .toEqual(['Icon', 'Badge', 'Button', 'TextField']);
    expect(manifest.components.map(({ docsUrl }) => docsUrl)).toEqual([
      '/components/icon/',
      '/components/badge/',
      '/components/button/',
      '/components/text-field/',
    ]);
  });

  it('requires all entries before the release check can pass', () => {
    expect(() => buildComponentManifest([document('Icon')], { requireFigma: true }))
      .toThrow('Release manifest is missing components: Badge, Button, TextField');
  });

  it('requires a Figma URL on every complete release entry', () => {
    const documents = ['Icon', 'Badge', 'Button', 'TextField']
      .map((name) => document(name as ComponentMetadata['name']));
    expect(() => buildComponentManifest(documents, { requireFigma: true }))
      .toThrow('Figma URLs are required for release: Icon, Badge, Button, TextField');
  });

  it('renders stable two-space JSON with LF and a final newline', () => {
    const rendered = renderComponentManifest(buildComponentManifest([document('Button')]));
    expect(rendered).toBe(`${JSON.stringify({
      schemaVersion: 1,
      components: [{ ...metadata('Button'), docsUrl: '/components/button/' }],
    }, null, 2)}\n`);
  });

  it('detects stale JSON without writing and writes only in write mode', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'component-manifest-'));
    temporaryDirectories.push(directory);
    const path = join(directory, 'components.json');
    await writeFile(path, 'stale\n', 'utf8');
    const expected = renderComponentManifest(buildComponentManifest([]));

    await expect(applyManifestMode('check', path, expected))
      .rejects.toThrow(`Stale component manifest: ${path}. Run "pnpm manifest:write".`);
    expect(await readFile(path, 'utf8')).toBe('stale\n');

    await applyManifestMode('write', path, expected);
    expect(await readFile(path, 'utf8')).toBe(expected);
  });
});
```

- [ ] **Step 5: Run the tests and verify the intended red state**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:unit
```

Expected: FAIL with missing-module errors for `src/content/component-schema`, `src/content/page-schema`, `scripts/validate-component-template`, and `scripts/component-manifest`. Do not weaken the tests.

---

### Task 2: Implement validated collections and deterministic manifest generation

**Files:**
- Create `apps/docs/src/content/page-schema.ts`.
- Create `apps/docs/src/content/component-schema.ts`.
- Create `apps/docs/src/content.config.ts`.
- Create `apps/docs/src/content/components/.gitkeep`.
- Create `apps/docs/scripts/validate-component-template.ts`.
- Create `apps/docs/scripts/component-manifest.ts`.
- Generate `apps/docs/public/design-system/components.json`.

**Interfaces:**
- Produces Astro collections `guides`, `foundations`, and `components`.
- Produces `ComponentMetadata`, `componentSchema`, `validateComponentMetadata()`.
- Produces `REQUIRED_COMPONENT_HEADINGS`, `extractSecondLevelHeadings()`, and `validateComponentTemplate()`.
- Produces manifest CLI `--write|--check` with optional `--require-figma`.

- [ ] **Step 1: Add page and component schemas**

Create `apps/docs/src/content/page-schema.ts`:

```ts
import { z } from 'astro/zod';

export const GUIDE_SLUGS = ['principles', 'getting-started'] as const;
export const FOUNDATION_SLUGS = [
  'colors',
  'typography',
  'spacing',
  'radius',
  'elevation',
] as const;

export const guideSchema = z.object({
  slug: z.enum(GUIDE_SLUGS),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
});

export const foundationSchema = z.object({
  slug: z.enum(FOUNDATION_SLUGS),
  title: z.string().min(1),
  description: z.string().min(1),
  order: z.number().int().positive(),
  tokenPrefixes: z.array(z.string().min(1)).min(1),
});
```

Create `apps/docs/src/content/component-schema.ts`:

```ts
import { z } from 'astro/zod';

export const COMPONENT_NAMES = ['Icon', 'Badge', 'Button', 'TextField'] as const;
export const COMPONENT_SLUGS = ['icon', 'badge', 'button', 'text-field'] as const;

export const COMPONENTS = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
  { name: 'Button', slug: 'button' },
  { name: 'TextField', slug: 'text-field' },
] as const;
export const COMPONENT_ORDER = new Map(
  COMPONENTS.map(({ name }, index) => [name, index]),
);

const slugByName = new Map(COMPONENTS.map(({ name, slug }) => [name, slug]));

export const componentSchema = z.object({
  name: z.enum(COMPONENT_NAMES),
  slug: z.enum(COMPONENT_SLUGS),
  description: z.string().min(1),
  status: z.literal('preview'),
  figmaUrl: z.union([z.literal(''), z.string().url()]),
  frameworks: z.object({
    react: z.literal('preview'),
    svelte: z.literal('planned'),
    reactNative: z.literal('planned'),
  }),
  variants: z.array(z.string()),
  sizes: z.array(z.string()),
  states: z.array(z.string()),
  accessibility: z.string().min(1),
  props: z.array(z.object({
    name: z.string(),
    type: z.string(),
    required: z.boolean(),
    defaultValue: z.string().nullable(),
    description: z.string(),
  })),
  tokens: z.array(z.string()).min(1),
}).superRefine((value, context) => {
  const expectedSlug = slugByName.get(value.name);
  if (value.slug !== expectedSlug) {
    context.addIssue({
      code: 'custom',
      path: ['slug'],
      message: `${value.name} must use slug ${expectedSlug}`,
    });
  }
});

export type ComponentMetadata = z.infer<typeof componentSchema>;

export function validateComponentMetadata(
  value: unknown,
  source: string,
): ComponentMetadata {
  const result = componentSchema.safeParse(value);
  if (result.success) return result.data;
  const details = result.error.issues
    .map((issue) => `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`)
    .join('; ');
  throw new Error(`${source}: ${details}`);
}
```

- [ ] **Step 2: Register all MDX through current glob-loader APIs**

Create `apps/docs/src/content.config.ts`:

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { componentSchema } from './content/component-schema';
import { foundationSchema, guideSchema } from './content/page-schema';

const guides = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guides' }),
  schema: guideSchema,
});

const foundations = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/foundations' }),
  schema: foundationSchema,
});

const components = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/components' }),
  schema: componentSchema,
});

export const collections = { guides, foundations, components };
```

Create `apps/docs/src/content/components/.gitkeep` as an intentionally zero-byte tracked file. It keeps the empty collection directory available until Plan 03 adds `icon.mdx`, `badge.mdx`, `button.mdx`, and `text-field.mdx`.

- [ ] **Step 3: Implement the exact H2 template validator**

Create `apps/docs/scripts/validate-component-template.ts`:

```ts
export const REQUIRED_COMPONENT_HEADINGS = [
  '예제',
  '사용해야 할 때',
  '사용하지 말아야 할 때',
  '구조',
  '크기와 변형',
  '상태와 동작',
  '반응형 동작',
  '접근성',
  'React 예제',
  'API',
  '사용 토큰',
  'Figma',
  '지원 상태',
] as const;

function tagDepthDelta(line: string): number {
  const tags = line.match(/<\/?[A-Za-z][^>]*>|<>|<\/>/g) ?? [];
  return tags.reduce((depth, tag) => {
    if (tag.startsWith('</') || tag === '</>') return depth - 1;
    if (tag.endsWith('/>')) return depth;
    return depth + 1;
  }, 0);
}

export function extractSecondLevelHeadings(source: string): string[] {
  const headings: string[] = [];
  let fence: '`' | '~' | null = null;
  let fenceLength = 0;
  let jsxDepth = 0;
  let pendingJsxTag = '';

  for (const line of source.replaceAll('\r\n', '\n').split('\n')) {
    const trimmed = line.trimStart();
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1]!;
      const markerKind = marker[0] as '`' | '~';
      if (fence === null) {
        fence = markerKind;
        fenceLength = marker.length;
        continue;
      }
      if (fence === markerKind && marker.length >= fenceLength) {
        fence = null;
        fenceLength = 0;
      }
      continue;
    }
    if (fence !== null) continue;

    if (pendingJsxTag !== '') {
      pendingJsxTag += `\n${line}`;
      if (line.includes('>')) {
        jsxDepth = Math.max(0, jsxDepth + tagDepthDelta(pendingJsxTag));
        pendingJsxTag = '';
      }
      continue;
    }

    if (trimmed.startsWith('<') && !trimmed.includes('>')) {
      pendingJsxTag = line;
      continue;
    }

    const depthBefore = jsxDepth;
    jsxDepth = Math.max(0, jsxDepth + tagDepthDelta(line));
    if (depthBefore > 0 || trimmed.startsWith('<')) continue;

    const heading = line.match(/^##(?!#)\s+(.+?)\s*#*\s*$/);
    if (heading) headings.push(heading[1]!.trim());
  }
  return headings;
}

export function validateComponentTemplate(source: string, filePath: string): void {
  const actual = extractSecondLevelHeadings(source);
  const count = Math.max(REQUIRED_COMPONENT_HEADINGS.length, actual.length);
  for (let index = 0; index < count; index += 1) {
    const expectedHeading = REQUIRED_COMPONENT_HEADINGS[index];
    const actualHeading = actual[index];
    if (expectedHeading !== actualHeading) {
      throw new Error(
        `${filePath}: component heading ${index + 1} expected "${expectedHeading ?? '<none>'}" but found "${actualHeading ?? '<missing>'}".`,
      );
    }
  }
}
```

- [ ] **Step 4: Implement deterministic manifest read, build, write, and check**

Create `apps/docs/scripts/component-manifest.ts`:

```ts
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
  COMPONENT_NAMES,
  COMPONENT_ORDER,
  type ComponentMetadata,
  validateComponentMetadata,
} from '../src/content/component-schema';
import { validateComponentTemplate } from './validate-component-template';

export interface ComponentDocument {
  filePath: string;
  data: unknown;
  body: string;
}

export type ComponentManifestEntry = ComponentMetadata & {
  docsUrl: `/components/${string}/`;
};

export interface ComponentManifest {
  schemaVersion: 1;
  components: ComponentManifestEntry[];
}

export const COMPONENT_CONTENT_DIRECTORY = fileURLToPath(
  new URL('../src/content/components/', import.meta.url),
);
export const COMPONENT_MANIFEST_PATH = fileURLToPath(
  new URL('../public/design-system/components.json', import.meta.url),
);

export async function readComponentDocuments(
  directory = COMPONENT_CONTENT_DIRECTORY,
): Promise<ComponentDocument[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
    .map((entry) => resolve(directory, entry.name))
    .sort((left, right) => left.localeCompare(right, 'en'));
  return Promise.all(paths.map(async (filePath) => {
    const source = await readFile(filePath, 'utf8');
    const parsed = matter(source);
    return { filePath, data: parsed.data, body: parsed.content };
  }));
}

export function buildComponentManifest(
  documents: ComponentDocument[],
  options: { requireFigma?: boolean } = {},
): ComponentManifest {
  const names = new Set<string>();
  const slugs = new Set<string>();
  const components = documents.map((document) => {
    const data = validateComponentMetadata(document.data, document.filePath);
    validateComponentTemplate(document.body, document.filePath);
    const fileId = basename(document.filePath, '.mdx');
    if (fileId !== data.slug) {
      throw new Error(`${document.filePath}: file id ${fileId} must match slug ${data.slug}`);
    }
    if (names.has(data.name)) throw new Error(`Duplicate component name: ${data.name}`);
    if (slugs.has(data.slug)) throw new Error(`Duplicate component slug: ${data.slug}`);
    names.add(data.name);
    slugs.add(data.slug);
    return { ...data, docsUrl: `/components/${data.slug}/` as const };
  }).sort((left, right) =>
    COMPONENT_ORDER.get(left.name)! - COMPONENT_ORDER.get(right.name)!);

  if (options.requireFigma) {
    const missing = COMPONENT_NAMES.filter((name) => !names.has(name));
    if (missing.length > 0) {
      throw new Error(`Release manifest is missing components: ${missing.join(', ')}`);
    }
    const missingFigma = components
      .filter(({ figmaUrl }) => figmaUrl === '')
      .map(({ name }) => name);
    if (missingFigma.length > 0) {
      throw new Error(`Figma URLs are required for release: ${missingFigma.join(', ')}`);
    }
  }
  return { schemaVersion: 1, components };
}

export function renderComponentManifest(manifest: ComponentManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

export async function applyManifestMode(
  mode: 'write' | 'check',
  outputPath: string,
  rendered: string,
): Promise<void> {
  if (mode === 'write') {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, rendered, 'utf8');
    return;
  }
  let current: string | undefined;
  try {
    current = await readFile(outputPath, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (current !== rendered) {
    throw new Error(
      `Stale component manifest: ${outputPath}. Run "pnpm manifest:write".`,
    );
  }
}

function parseArguments(args: string[]): {
  mode: 'write' | 'check';
  requireFigma: boolean;
} {
  const known = new Set(['--write', '--check', '--require-figma']);
  const unknown = args.filter((argument) => !known.has(argument));
  if (unknown.length > 0) throw new Error(`Unknown argument: ${unknown.join(', ')}`);
  const write = args.includes('--write');
  const check = args.includes('--check');
  if (write === check) throw new Error('Choose exactly one of --write or --check.');
  return { mode: write ? 'write' : 'check', requireFigma: args.includes('--require-figma') };
}

export async function runComponentManifestCli(args: string[]): Promise<void> {
  const { mode, requireFigma } = parseArguments(args);
  const documents = await readComponentDocuments();
  const rendered = renderComponentManifest(
    buildComponentManifest(documents, { requireFigma }),
  );
  await applyManifestMode(mode, COMPONENT_MANIFEST_PATH, rendered);
  if (mode === 'write') console.log(`Wrote ${COMPONENT_MANIFEST_PATH}`);
}

const directEntry = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : '';
if (directEntry === import.meta.url) {
  runComponentManifestCli(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
```

- [ ] **Step 5: Run focused unit tests, write the initial manifest, and verify green**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:unit
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
```

Expected: all unit tests PASS; write prints the absolute `components.json` path; check is silent and exits 0. The generated file is exactly:

```json
{
  "schemaVersion": 1,
  "components": []
}
```

- [ ] **Step 6: Prove stale checking is read-only**

Run:

```powershell
Copy-Item apps/docs/public/design-system/components.json $env:TEMP\components-json-backup
Add-Content apps/docs/public/design-system/components.json 'stale'
corepack pnpm --filter @maxxuxx/docs manifest:check
Compare-Object (Get-Content apps/docs/public/design-system/components.json) (Get-Content $env:TEMP\components-json-backup)
Copy-Item $env:TEMP\components-json-backup apps/docs/public/design-system/components.json
corepack pnpm --filter @maxxuxx/docs manifest:check
Remove-Item $env:TEMP\components-json-backup
```

Expected: the first check exits 1 with `Stale component manifest:` and `Run "pnpm manifest:write".`; `Compare-Object` still shows the manually added line, proving check did not rewrite; the restored check exits 0.

- [ ] **Step 7: Commit the validated content pipeline**

```powershell
git add apps/docs/astro.config.mjs apps/docs/tsconfig.json apps/docs/vitest.config.ts apps/docs/src/content.config.ts apps/docs/src/content apps/docs/scripts apps/docs/tests/unit apps/docs/public/design-system/components.json
git commit -m "feat(docs): add validated content manifest pipeline"
```

---

### Task 5: Complete final route, link, component-document, AI, accessibility, responsive, and visual QA

**Prerequisites:** Plan 03 has added all four component MDX/demo slices, `BaseLayout.astro` imports `@maxxuxx/react/styles.css` once, and the Figma workflow has populated all four `figmaUrl` values. This task performs no component or Figma writes.

**Files:**
- Replace `apps/docs/tests/e2e/navigation.spec.ts`.
- Create `apps/docs/tests/e2e/components.spec.ts`.
- Create `apps/docs/tests/e2e/ai-artifacts.spec.ts`.
- Create `apps/docs/tests/e2e/accessibility.spec.ts`.
- Create `apps/docs/tests/e2e/visual.spec.ts`.
- Generate the twelve exact full-page PNGs listed in the Exact File Map.

- [ ] **Step 1: Verify the prerequisite red/green gates before adding final suites**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:release-check
```

Expected before all component MDX exists: exit 1 with `Release manifest is missing components:` followed by the fixed-order missing names. Expected after all MDX exists but a URL is empty: exit 1 with `Figma URLs are required for release:` followed by fixed-order names. Resume only when `manifest:release-check` exits 0.

- [ ] **Step 2: Replace navigation smoke tests with canonical route and same-origin link coverage**

Replace `apps/docs/tests/e2e/navigation.spec.ts` with:

```ts
import { test } from '@playwright/test';
import {
  CANONICAL_HTML_ROUTES,
  assertNoHorizontalOverflow,
  assertSameOriginLinks,
  openHtmlRoute,
} from './support/routes';

for (const route of CANONICAL_HTML_ROUTES) {
  test(`${route.path} renders, fits, and has valid same-origin links`, async ({ page, request }) => {
    await openHtmlRoute(page, route);
    await assertNoHorizontalOverflow(page);
    await assertSameOriginLinks(page, request);
  });
}
```

- [ ] **Step 3: Add rendered component-document contract tests**

Create `apps/docs/tests/e2e/components.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import { REQUIRED_COMPONENT_HEADINGS } from '../../scripts/validate-component-template';
import { COMPONENT_HTML_ROUTES, openHtmlRoute } from './support/routes';

for (const route of COMPONENT_HTML_ROUTES) {
  test(`${route.heading} renders its complete document template and demo`, async ({ page }) => {
    await openHtmlRoute(page, route);
    const headings = await page.locator('main h2').allTextContents();
    expect(headings.map((heading) => heading.trim())).toEqual(REQUIRED_COMPONENT_HEADINGS);
    await expect(page.locator(`[data-component-demo="${route.slug}"]`)).toBeVisible();
    await expect(page.getByText('preview', { exact: true }).first()).toBeVisible();
  });
}
```

- [ ] **Step 4: Add exact public AI-artifact tests**

Create `apps/docs/tests/e2e/ai-artifacts.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('tokens.json exposes the complete resolved token contract', async ({ request }) => {
  const response = await request.get('/design-system/tokens.json');
  expect(response.status()).toBe(200);
  const artifact = await response.json();
  expect(artifact.schemaVersion).toBe(1);
  expect(artifact.tokens).toHaveLength(106);
  for (const token of artifact.tokens) {
    expect(token).toEqual(expect.objectContaining({
      name: expect.any(String),
      type: expect.stringMatching(/^(color|dimension|fontFamily|fontWeight|shadow)$/),
      kind: expect.stringMatching(/^(primitive|semantic)$/),
      description: expect.any(String),
      cssVariable: expect.stringMatching(/^--ds-/),
    }));
    expect(['string', 'number']).toContain(typeof token.value);
    expect(['string', 'number']).toContain(typeof token.resolvedValue);
  }
});

test('components.json exposes all four release-ready component contracts', async ({ request }) => {
  const response = await request.get('/design-system/components.json');
  expect(response.status()).toBe(200);
  const artifact = await response.json();
  expect(artifact.schemaVersion).toBe(1);
  expect(artifact.components.map(({ name }: { name: string }) => name))
    .toEqual(['Icon', 'Badge', 'Button', 'TextField']);
  expect(artifact.components.map(({ docsUrl }: { docsUrl: string }) => docsUrl)).toEqual([
    '/components/icon/',
    '/components/badge/',
    '/components/button/',
    '/components/text-field/',
  ]);
  for (const component of artifact.components) {
    expect(component.status).toBe('preview');
    expect(component.frameworks).toEqual({
      react: 'preview',
      svelte: 'planned',
      reactNative: 'planned',
    });
    expect(component.figmaUrl).not.toBe('');
    expect(() => new URL(component.figmaUrl)).not.toThrow();
    expect(component.description).not.toBe('');
    expect(component.accessibility).not.toBe('');
    expect(Array.isArray(component.variants)).toBe(true);
    expect(Array.isArray(component.sizes)).toBe(true);
    expect(Array.isArray(component.states)).toBe(true);
    expect(Array.isArray(component.props)).toBe(true);
    expect(component.tokens.length).toBeGreaterThan(0);
  }
});
```

- [ ] **Step 5: Add real-browser axe and keyboard/focus tests**

Create `apps/docs/tests/e2e/accessibility.spec.ts`:

```ts
import { expect, test } from '@playwright/test';
import {
  assertNoAxeViolations,
  expectTabSequence,
  expectVisibleFocus,
  tabTo,
} from './support/accessibility';
import { CANONICAL_HTML_ROUTES, openHtmlRoute } from './support/routes';

for (const route of CANONICAL_HTML_ROUTES) {
  test(`${route.path} has zero automatic axe violations`, async ({ page }) => {
    await openHtmlRoute(page, route);
    await assertNoAxeViolations(page);
  });
}

test('header and responsive navigation have logical visible keyboard focus', async ({ page }) => {
  await openHtmlRoute(page, CANONICAL_HTML_ROUTES[0]);
  const skipLink = page.getByRole('link', { name: '본문으로 건너뛰기' });
  const brand = page.getByRole('link', { name: 'AI-Readable DS' });
  await expectTabSequence(page, [skipLink, brand]);

  if (page.viewportSize()!.width < 960) {
    const summary = page.getByText('메뉴', { exact: true });
    await page.keyboard.press('Tab');
    await expectVisibleFocus(summary);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('navigation', { name: '모바일 문서 탐색' })).toBeVisible();
    await tabTo(page, page.getByRole('navigation', { name: '모바일 문서 탐색' })
      .getByRole('link', { name: '소개', exact: true }));
  } else {
    await tabTo(page, page.locator('aside').getByRole('link', { name: '소개', exact: true }));
  }
});

test('Button demo is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/button/', heading: 'Button' });
  await tabTo(page, page.locator('[data-component-demo="button"] button').first());
});

test('TextField demo input is keyboard reachable with visible focus', async ({ page }) => {
  await openHtmlRoute(page, { path: '/components/text-field/', heading: 'TextField' });
  await tabTo(page, page.locator('[data-component-demo="text-field"] input').first());
});
```

- [ ] **Step 6: Add full-page responsive visual comparisons**

Create `apps/docs/tests/e2e/visual.spec.ts`:

```ts
import { test } from '@playwright/test';
import { assertNoHorizontalOverflow, openHtmlRoute } from './support/routes';
import { expectPageScreenshot } from './support/visual';

test.skip(process.platform !== 'win32', 'Visual baselines are approved only on Windows Chromium.');

const cases = [
  { name: 'home', path: '/', heading: '사람과 AI가 함께 읽는 디자인 시스템' },
  { name: 'foundations-colors', path: '/foundations/colors/', heading: '색상' },
  { name: 'button', path: '/components/button/', heading: 'Button' },
  { name: 'text-field', path: '/components/text-field/', heading: 'TextField' },
] as const;

for (const visualCase of cases) {
  test(`${visualCase.name} matches the reviewed full-page baseline`, async ({ page }, testInfo) => {
    await openHtmlRoute(page, visualCase);
    await assertNoHorizontalOverflow(page);
    await expectPageScreenshot(page, testInfo, visualCase.name);
  });
}
```

- [ ] **Step 7: Run the final suites once to observe missing-baseline red**

Run on Windows:

```powershell
corepack pnpm --filter @maxxuxx/docs test:e2e
```

Expected on the first run: non-visual route, link, document, JSON, axe, keyboard, and overflow tests PASS; visual tests report the twelve missing baseline paths and fail. Any other failure is a product defect to fix before approving images.

- [ ] **Step 8: Generate, inspect, and re-run exact baselines**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs test:e2e -- --update-snapshots
Get-ChildItem apps/docs/tests/e2e/__snapshots__/visual.spec -File | Sort-Object Name
corepack pnpm --filter @maxxuxx/docs test:e2e
```

Expected: exactly the twelve PNGs listed in the Exact File Map. Inspect every PNG at original size; reject clipped navigation, overflow, unreadable type, missing demos, unstable content, or incorrect responsive layout. The unchanged second run passes all three Chromium projects.

- [ ] **Step 9: Run final docs and repository verification**

Run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs manifest:release-check
corepack pnpm --filter @maxxuxx/docs test:unit
corepack pnpm --filter @maxxuxx/docs check
corepack pnpm --filter @maxxuxx/docs build
corepack pnpm --filter @maxxuxx/docs test:e2e
corepack pnpm verify
```

Expected: every command exits 0; all twelve HTML routes and both JSON routes are present; every component remains `preview` with React `preview`, Svelte `planned`, and React Native `planned`; no generated artifact is stale.

- [ ] **Step 10: Commit final browser QA**

```powershell
git add apps/docs/tests/e2e apps/docs/public/design-system/components.json
git commit -m "test(docs): add complete browser and artifact QA"
```

---

## Acceptance Matrix

| Requirement | Evidence |
|---|---|
| All MDX validated | Three `glob()` collections plus `content.test.ts` loose-MDX guard |
| Current Astro APIs | `src/content.config.ts`, `entry.id`, `getCollection()`, imported `render(entry)` |
| Deterministic manifest | fixed component order, LF/final newline, write/check tests |
| Release Figma gate without Figma writes | `manifest:release-check` requires four non-empty URLs |
| Static guides and Foundations | eight platform HTML routes and production output assertions |
| Responsive shell | disclosure below 960px, 280px sidebar above 960px, locked content widths |
| Canonical route/link integrity | exact H1 assertion, status 200, same-origin GET and fragment checks |
| Accessibility | axe zero violations, logical Tab order, visible focus, native demo reachability |
| Responsive safety | horizontal-overflow assertion in all three projects |
| AI readability | token and component JSON browser-contract tests |
| Visual review | twelve full-page Windows Chromium baselines plus Plan 03 component-slice baselines |

## Current API References

- Astro Content Collections API: https://docs.astro.build/en/reference/modules/astro-content/
- Astro Content Loader API: https://docs.astro.build/en/reference/content-loader-reference/
- Playwright web server configuration: https://playwright.dev/docs/test-webserver
- Playwright accessibility testing: https://playwright.dev/docs/accessibility-testing
- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
