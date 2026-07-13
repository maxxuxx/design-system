# Pretendard Font System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Self-host Pretendard Variable dynamic subsets and make the web packages, documentation site, generated artifacts, and linked Figma library use the same Pretendard-first typography system.

**Architecture:** `@maxxuxx/tokens` exposes an opt-in `fonts.css` entrypoint backed by vendored official v1.3.9 WOFF2 subsets while `tokens.css` remains token-only. The source family token drives code artifacts, and the existing Figma variable and text-style IDs are updated in place and read back into verification evidence.

**Tech Stack:** pnpm 11, TypeScript 6, Vitest 4, Astro 7, Playwright 1.61, CSS `@font-face`, Pretendard v1.3.9, Figma variables and text styles

## Global Constraints

- Vendor the official Pretendard v1.3.9 Variable dynamic subset files without modifying the font binaries.
- Include the upstream SIL Open Font License 1.1 and attribution.
- Make no runtime requests to an external font host.
- Export fonts through `@maxxuxx/tokens/fonts.css`; do not merge font loading into `tokens.css`.
- Use `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif` as the exact `font/family/sans` value.
- Preserve all existing Figma Variable IDs and Text Style IDs.
- Stop the Figma migration if Pretendard is unavailable; do not save a fallback family.

---

### Task 1: Vendored font package contract

**Files:**
- Create: `packages/tokens/tests/fonts.test.ts`
- Create: `packages/tokens/fonts.css`
- Create: `packages/tokens/fonts/pretendard/LICENSE.txt`
- Create: `packages/tokens/fonts/pretendard/woff2/PretendardVariable.subset.0.woff2` through `PretendardVariable.subset.91.woff2`
- Modify: `packages/tokens/package.json`

**Interfaces:**
- Consumes: official `pretendard@1.3.9` files under `dist/web/variable/`
- Produces: package export `@maxxuxx/tokens/fonts.css` and local URLs under `./fonts/pretendard/woff2/`

- [ ] **Step 1: Write the failing font-package contract test**

Create `packages/tokens/tests/fonts.test.ts` with tests that read `fonts.css`, `package.json`, and every referenced asset:

```ts
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = new URL('../', import.meta.url);
const fontsCssUrl = new URL('../fonts.css', import.meta.url);

describe('Pretendard font package', () => {
  it('exports a local variable dynamic-subset stylesheet', async () => {
    const packageJson = JSON.parse(
      await readFile(new URL('../package.json', import.meta.url), 'utf8'),
    ) as { exports: Record<string, string> };
    const css = await readFile(fontsCssUrl, 'utf8');
    const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)]
      .map((match) => match[1]!);

    expect(packageJson.exports['./fonts.css']).toBe('./fonts.css');
    expect(css).toContain("font-family: 'Pretendard Variable'");
    expect(css).toContain('font-weight: 45 920');
    expect(css).toContain('font-display: swap');
    expect(css).not.toMatch(/https?:|\/\//);
    expect(urls).toHaveLength(92);
    expect(new Set(urls).size).toBe(92);

    await Promise.all(urls.map(async (relative) => {
      expect(relative).toMatch(/^\.\/fonts\/pretendard\/woff2\/PretendardVariable\.subset\.\d+\.woff2$/);
      await access(new URL(relative, fontsCssUrl));
    }));
    await access(new URL('./fonts/pretendard/LICENSE.txt', packageRoot));
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
corepack pnpm --filter @maxxuxx/tokens test -- fonts.test.ts
```

Expected: FAIL because `packages/tokens/fonts.css` does not exist.

- [ ] **Step 3: Vendor the official assets into a temporary directory**

Run:

```bash
rm -rf /tmp/pretendard-1.3.9
mkdir -p /tmp/pretendard-1.3.9
npm pack pretendard@1.3.9 --pack-destination /tmp/pretendard-1.3.9
tar -xzf /tmp/pretendard-1.3.9/pretendard-1.3.9.tgz -C /tmp/pretendard-1.3.9
```

Expected: `/tmp/pretendard-1.3.9/package/dist/web/variable/pretendardvariable-dynamic-subset.css`, 92 files under `woff2-dynamic-subset`, and `dist/LICENSE.txt` exist.

- [ ] **Step 4: Copy the unmodified WOFF2 files and license**

Create `packages/tokens/fonts/pretendard/woff2/`, then copy the 92 official
`PretendardVariable.subset.*.woff2` files and `dist/LICENSE.txt` from the
temporary package. Binary files must remain byte-identical; verify with:

```bash
diff <(cd /tmp/pretendard-1.3.9/package/dist/web/variable/woff2-dynamic-subset && shasum -a 256 PretendardVariable.subset.*.woff2) <(cd packages/tokens/fonts/pretendard/woff2 && shasum -a 256 PretendardVariable.subset.*.woff2)
```

Expected: no output.

- [ ] **Step 5: Create the local stylesheet and package export**

Copy the official `pretendardvariable-dynamic-subset.css` to
`packages/tokens/fonts.css`, replace only URL prefixes
`./woff2-dynamic-subset/` with `./fonts/pretendard/woff2/`, and add
`font-display: swap` to every `@font-face` block. Add this export to
`packages/tokens/package.json`:

```json
"./fonts.css": "./fonts.css"
```

Do not change family names, weight ranges, unicode ranges, or font binaries.

- [ ] **Step 6: Run the package contract test**

Run:

```bash
corepack pnpm --filter @maxxuxx/tokens test -- fonts.test.ts
```

Expected: PASS, with 92 unique local WOFF2 URLs.

- [ ] **Step 7: Commit the font package**

```bash
git add packages/tokens/fonts.css packages/tokens/fonts packages/tokens/package.json packages/tokens/tests/fonts.test.ts
git commit -m "feat(tokens): self-host Pretendard variable subsets"
```

### Task 2: Pretendard typography token and documentation

**Files:**
- Modify: `packages/tokens/src/primitives.tokens.json`
- Modify: `packages/tokens/tests/generate.test.ts`
- Modify: `apps/docs/src/layouts/BaseLayout.astro`
- Modify: `apps/docs/src/content/foundations/typography.mdx`
- Regenerate: `packages/tokens/dist/tokens.css`
- Regenerate: `packages/tokens/dist/tokens.json`
- Regenerate: `apps/docs/public/design-system/tokens.json`

**Interfaces:**
- Consumes: `@maxxuxx/tokens/fonts.css` from Task 1
- Produces: exact Pretendard-first value for `--ds-font-family-sans`

- [ ] **Step 1: Change the generator assertion first**

Replace the old IBM Plex assertion in `packages/tokens/tests/generate.test.ts` with:

```ts
expect(css).toContain(
  '  --ds-font-family-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif;',
);
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
corepack pnpm --filter @maxxuxx/tokens test -- generate.test.ts
```

Expected: FAIL because the generated value still starts with IBM Plex Sans KR.

- [ ] **Step 3: Update the source token and documentation import**

Set `font/family/sans` in `packages/tokens/src/primitives.tokens.json` to:

```json
{
  "name": "font/family/sans",
  "type": "fontFamily",
  "kind": "primitive",
  "value": "\"Pretendard Variable\", Pretendard, -apple-system, BlinkMacSystemFont, \"Segoe UI\", \"Noto Sans KR\", sans-serif",
  "description": "자체 호스팅 Pretendard Variable과 한국어 시스템 fallback을 제공하는 기본 sans-serif 글꼴 stack입니다."
}
```

Add this as the first style import in `apps/docs/src/layouts/BaseLayout.astro`:

```astro
import '@maxxuxx/tokens/fonts.css';
```

Update `apps/docs/src/content/foundations/typography.mdx` to state that the site
self-hosts Pretendard Variable v1.3.9, applications opt in by importing
`@maxxuxx/tokens/fonts.css`, and the platform stack is used only as fallback.

- [ ] **Step 4: Regenerate artifacts**

Run:

```bash
corepack pnpm --filter @maxxuxx/tokens tokens:generate
```

Expected: the three generated artifacts are written and contain the new stack.

- [ ] **Step 5: Run token and content tests**

Run:

```bash
corepack pnpm --filter @maxxuxx/tokens test
corepack pnpm --filter @maxxuxx/docs test -- content.test.ts
corepack pnpm run generated:check
```

Expected: all commands PASS.

- [ ] **Step 6: Commit the token migration**

```bash
git add packages/tokens/src/primitives.tokens.json packages/tokens/tests/generate.test.ts packages/tokens/dist/tokens.css packages/tokens/dist/tokens.json apps/docs/public/design-system/tokens.json apps/docs/src/layouts/BaseLayout.astro apps/docs/src/content/foundations/typography.mdx
git commit -m "feat(typography): adopt Pretendard font token"
```

### Task 3: Runtime font and build verification

**Files:**
- Modify: `apps/docs/tests/e2e/ai-artifacts.spec.ts`
- Modify: `tooling/verification/artifacts.mjs`
- Modify: `tooling/verification/artifacts.test.mjs`
- Update as required: `apps/docs/tests/e2e/visual.spec.ts-snapshots/*`
- Update as required: `apps/docs/tests/e2e/component-slices.visual.spec.ts-snapshots/*`

**Interfaces:**
- Consumes: docs import and font assets from Tasks 1-2
- Produces: automated proof that the built site serves and applies Pretendard

- [ ] **Step 1: Add a failing browser font test**

Append to `apps/docs/tests/e2e/ai-artifacts.spec.ts`:

```ts
test('documentation loads the self-hosted Pretendard variable font', async ({ page }) => {
  await page.goto('/foundations/typography/');
  await page.evaluate(async () => { await document.fonts.ready; });

  const result = await page.locator('body').evaluate((body) => ({
    family: getComputedStyle(body).fontFamily,
    loaded: document.fonts.check('16px "Pretendard Variable"', '타이포그래피'),
  }));

  expect(result.family).toContain('Pretendard Variable');
  expect(result.loaded).toBe(true);
});
```

- [ ] **Step 2: Extend artifact verification with a focused font validator**

Add `verifyFontArtifacts(root)` to `tooling/verification/artifacts.mjs`. It must:

```js
export async function verifyFontArtifacts(root) {
  const cssPath = path.join(root, 'packages', 'tokens', 'fonts.css');
  const css = await readFile(cssPath, 'utf8');
  const urls = [...css.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((match) => match[1]);
  const violations = [];
  if (urls.length !== 92) violations.push('Pretendard fonts.css must reference exactly 92 subsets');
  if (/https?:|\/\//.test(css)) violations.push('Pretendard fonts.css must not use external URLs');
  if (!css.includes('font-display: swap')) violations.push('Pretendard fonts.css must use font-display: swap');
  for (const url of urls) {
    try { await access(path.resolve(path.dirname(cssPath), url)); }
    catch { violations.push(`Missing Pretendard font asset: ${url}`); }
  }
  try { await access(path.join(root, 'packages', 'tokens', 'fonts', 'pretendard', 'LICENSE.txt')); }
  catch { violations.push('Missing Pretendard SIL OFL license'); }
  return violations.sort();
}
```

Call it from the repository guardrail/artifact verification path. Add fixtures
to `tooling/verification/artifacts.test.mjs` proving missing license, external
URL, and missing WOFF2 cases fail with the exact messages above.

- [ ] **Step 3: Run tests to verify the new checks fail before complete wiring**

Run:

```bash
corepack pnpm run test:guardrails
corepack pnpm --filter @maxxuxx/docs test:e2e -- ai-artifacts.spec.ts
```

Expected: at least the newly added verification integration fails until the
font validator is called by the normal artifact flow; the browser test must
fail if the font asset import is absent or unresolved.

- [ ] **Step 4: Complete the verification wiring and build**

Integrate `verifyFontArtifacts(root)` with the normal verification command,
then run:

```bash
corepack pnpm run build
corepack pnpm run artifacts:check
corepack pnpm --filter @maxxuxx/docs test:e2e -- ai-artifacts.spec.ts
```

Expected: build, artifact checks, and the browser font test PASS. The Astro
output contains emitted WOFF2 assets and browser requests for them return 200.

- [ ] **Step 5: Regenerate and review visual baselines**

Run:

```bash
corepack pnpm --filter @maxxuxx/docs test:e2e -- visual.spec.ts component-slices.visual.spec.ts --update-snapshots
corepack pnpm --filter @maxxuxx/docs test:e2e -- visual.spec.ts component-slices.visual.spec.ts
```

Expected: only typography-metric differences appear; the second command PASSes
without updating snapshots.

- [ ] **Step 6: Commit runtime verification**

```bash
git add apps/docs/tests/e2e/ai-artifacts.spec.ts apps/docs/tests/e2e/*-snapshots tooling/verification/artifacts.mjs tooling/verification/artifacts.test.mjs
git commit -m "test(fonts): verify local Pretendard delivery"
```

### Task 4: Figma font migration and evidence readback

**Files:**
- Modify after live readback: `figma/verification.json`
- Keep stable unless live metadata differs: `figma/token-map.json`

**Interfaces:**
- Consumes: generated `font/family/sans` token value from Task 2 and existing IDs from `figma/token-map.json`
- Produces: live Figma variables and text styles using Pretendard, plus matching verification evidence

- [ ] **Step 1: Load the required Figma workflow skills and inspect live state**

Use `figma:figma-generate-library` and the mandatory `figma:figma-use` workflow
before any Figma write. Read the file URL from `figma/verification.json`. Inspect:

- the existing `font/family/sans` variable ID and value;
- all eight local text style IDs, names, and font names;
- available Pretendard family/style names;
- relevant text nodes that directly use `IBM Plex Sans KR`.

Expected: Pretendard can be loaded in the Figma context. If it cannot, stop this
task without writing a fallback.

- [ ] **Step 2: Update the variable and styles in place**

Set the existing family variable value to the exact CSS stack from Global
Constraints. Load the exact Pretendard family/style combinations needed for
Regular, Medium, SemiBold, and Bold, then update all eight existing text styles
without recreating them. Update relevant direct-font text nodes while
preserving their style bindings, characters, properties, and component IDs.

- [ ] **Step 3: Read back and assert the migration**

Read back:

- the family variable ID and value;
- the eight text style IDs and Pretendard font names;
- counts of remaining relevant `IBM Plex Sans KR` text nodes;
- component IDs for Badge, Button, and TextField.

Expected: existing IDs match `figma/token-map.json`, all eight text styles use
Pretendard, and no relevant IBM Plex Sans KR nodes remain.

- [ ] **Step 4: Refresh evidence and repository verification**

Update `figma/verification.json` with the readback timestamp, the token digest
computed by `tooling/verification/artifacts.mjs`, and refreshed screenshot
evidence for every required page affected by typography. Do not invent evidence
values; every digest and screenshot ID must come from live readback.

Run:

```bash
corepack pnpm run build
corepack pnpm run artifacts:check
```

Expected: PASS with no token-hash or stable-ID violations.

- [ ] **Step 5: Commit Figma synchronization**

```bash
git add figma/verification.json figma/token-map.json
git commit -m "feat(figma): synchronize Pretendard typography"
```

Only include `figma/token-map.json` if live readback required a legitimate
metadata update.

### Task 5: Full verification and final hygiene

**Files:**
- Modify only if a failing check identifies an in-scope Pretendard migration defect

**Interfaces:**
- Consumes: completed Tasks 1-4
- Produces: a clean, verified Pretendard migration

- [ ] **Step 1: Run the full repository verification**

```bash
corepack pnpm run verify
```

Expected: checks, unit tests, guardrail tests, generated artifact checks, build,
artifact validation, and Playwright E2E all PASS.

- [ ] **Step 2: Check external URL and stale-name hygiene**

```bash
rg -n "IBM Plex Sans KR|https?://.*pretendard|cdn.*pretendard" apps packages figma tooling -g '!*.md'
git diff --check
git status --short
```

Expected: no live IBM Plex Sans KR reference, no external Pretendard runtime URL,
no whitespace errors, and only intentional migration files are changed.

- [ ] **Step 3: Record final verification fixes if needed**

If Step 1 or Step 2 exposed an in-scope defect, add only the files required for
that defect and commit with a Conventional Commit message describing the actual
fix. Re-run `corepack pnpm run verify` after the commit and require PASS.
