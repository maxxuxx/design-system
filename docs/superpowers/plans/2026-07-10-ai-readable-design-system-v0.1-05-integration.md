# AI-Readable Design System v0.1 Integration Verification Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task, then use superpowers:verification-before-completion before any success claim. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 토큰·Astro 문서·React 파일럿·Figma 산출물을 하나의 로컬 `verify` 명령과 기계 판독 가능한 증거로 검증하고, 의도적인 Public 저장소 상태를 최종 통합 조건으로 확인한다.

**Architecture:** Node 표준 라이브러리 기반 guardrail 스크립트가 workspace 경계, 의미 색상 사용, 정적 build 산출물, Figma QA JSON을 검사한다. 기존 package tests와 Playwright를 순서대로 실행하고, 모든 생성 파일이 최신인지 확인한 뒤에만 v0.1 완료 상태를 기록한다.

**Tech Stack:** Node.js 24 built-in test runner, pnpm workspace scripts, Astro static output, Playwright, JSON verification artifacts, GitHub CLI.

## Global Constraints

- Execute only after plans 01–04 have completed their required checkpoints.
- Do not add deployment, publishing, auth, Svelte, React Native, dark mode, Code Connect, or release automation.
- A successful empty-search check must exit 0; do not rely on raw `rg` exit code 1.
- Final component status remains `preview`; React is `preview`; Svelte and React Native remain `planned`.
- Every component must have a non-empty Figma node URL at final verification.
- Code Connect remains unimplemented; machine-readable evidence must use exactly `codeConnect: "skipped-v0.1"` and reject published or connected states.
- The remote repository must read back `{"isPrivate":false,"visibility":"PUBLIC"}`. This intentional Public state is valid for push and v0.1 completion.

---

### Task 1: Add repository guardrail functions with tests

**Files:**
- Create: `tooling/verification/guardrails.mjs`
- Create: `tooling/verification/guardrails.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `findWorkspaceViolations(root): Promise<string[]>`.
- Produces: `findPrimitiveColorReferences(root): Promise<string[]>`.
- CLI exits 1 and prints one line per violation; exits 0 with a count summary otherwise.

- [ ] **Step 1: Write the failing tests**

Create temporary fixtures with `node:fs/promises.mkdtemp`. Cover an extra `packages/svelte`, a non-private package, a primitive color reference in React CSS, and allowed primitive references under both `apps/docs/src/components/foundations` and `apps/docs/src/content/foundations`.

```js
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findPrimitiveColorReferences, findWorkspaceViolations } from './guardrails.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-guardrail-'));
  await mkdir(path.join(root, 'apps', 'docs'), { recursive: true });
  await mkdir(path.join(root, 'packages', 'tokens'), { recursive: true });
  await mkdir(path.join(root, 'packages', 'react', 'src'), { recursive: true });
  for (const relative of ['apps/docs', 'packages/tokens', 'packages/react']) {
    await writeFile(path.join(root, relative, 'package.json'), JSON.stringify({ private: true }));
  }
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ private: true }));
  return root;
}

test('accepts only the three private workspaces', async () => {
  const root = await fixture();
  assert.deepEqual(await findWorkspaceViolations(root), []);
});

test('rejects an extra workspace and a public package', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'packages', 'svelte'), { recursive: true });
  await writeFile(path.join(root, 'packages', 'svelte', 'package.json'), JSON.stringify({ private: false }));
  const violations = await findWorkspaceViolations(root);
  assert.ok(violations.some((value) => value.includes('packages/svelte')));
  assert.ok(violations.some((value) => value.includes('private')));
});

test('rejects a missing required workspace', async () => {
  const root = await fixture();
  await rm(path.join(root, 'packages', 'react'), { recursive: true, force: true });
  const violations = await findWorkspaceViolations(root);
  assert.ok(violations.some((value) => value.includes('Missing workspace: packages/react')));
});

test('finds primitive colors in product code but ignores foundation visualizers', async () => {
  const root = await fixture();
  await writeFile(path.join(root, 'packages', 'react', 'src', 'button.css'), 'color: var(--ds-color-blue-600);');
  const allowed = path.join(root, 'apps', 'docs', 'src', 'components', 'foundations');
  await mkdir(allowed, { recursive: true });
  await writeFile(path.join(allowed, 'ColorGrid.astro'), '--ds-color-blue-600');
  const allowedContent = path.join(root, 'apps', 'docs', 'src', 'content', 'foundations');
  await mkdir(allowedContent, { recursive: true });
  await writeFile(path.join(allowedContent, 'colors.mdx'), '`--ds-color-blue-600`');
  const violations = await findPrimitiveColorReferences(root);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /button\.css/);
});
```

- [ ] **Step 2: Run tests and confirm the missing-module failure**

Run: `node --test tooling/verification/guardrails.test.mjs`

Expected: FAIL because `guardrails.mjs` does not exist.

- [ ] **Step 3: Implement the guardrails**

Use this complete implementation:

```js
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedWorkspaces = new Set(['apps/docs', 'packages/tokens', 'packages/react']);
const sourceExtensions = new Set(['.astro', '.css', '.mdx', '.ts', '.tsx']);
const primitivePattern = /--ds-color-(?:neutral|blue|red|green)-/;

async function directoryNames(root, group) {
  const base = path.join(root, group);
  try {
    const entries = await readdir(base, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => `${group}/${entry.name}`);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function findWorkspaceViolations(root) {
  const candidates = [
    ...(await directoryNames(root, 'apps')),
    ...(await directoryNames(root, 'packages')),
  ];
  const violations = [];
  for (const expected of allowedWorkspaces) {
    if (!candidates.includes(expected)) violations.push(`Missing workspace: ${expected}`);
  }
  for (const relative of candidates) {
    if (!allowedWorkspaces.has(relative)) violations.push(`Unexpected workspace: ${relative}`);
    const manifestPath = path.join(root, relative, 'package.json');
    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      if (manifest.private !== true) violations.push(`Workspace must be private: ${relative}`);
    } catch (error) {
      violations.push(`Unreadable workspace manifest: ${relative}: ${error.message}`);
    }
  }
  const rootManifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  if (rootManifest.private !== true) violations.push('Root package must be private');
  return violations.sort();
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

export async function findPrimitiveColorReferences(root) {
  const roots = [path.join(root, 'packages', 'react', 'src'), path.join(root, 'apps', 'docs', 'src')];
  const allowedFoundations = [
    path.normalize(path.join(root, 'apps', 'docs', 'src', 'components', 'foundations')),
    path.normalize(path.join(root, 'apps', 'docs', 'src', 'content', 'foundations')),
  ];
  const violations = [];
  for (const sourceRoot of roots) {
    const files = await walk(sourceRoot);
    for (const file of files) {
      if (!sourceExtensions.has(path.extname(file))) continue;
      const normalized = path.normalize(file);
      if (allowedFoundations.some((allowed) => normalized.startsWith(allowed + path.sep))) continue;
      const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
      lines.forEach((line, index) => {
        if (primitivePattern.test(line)) {
          violations.push(`${path.relative(root, file)}:${index + 1}: ${line.trim()}`);
        }
      });
    }
  }
  return violations.sort();
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const violations = [
    ...(await findWorkspaceViolations(root)),
    ...(await findPrimitiveColorReferences(root)),
  ];
  if (violations.length) {
    process.stderr.write(`${violations.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Guardrails passed: 3 private workspaces, 0 primitive color leaks\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
```

- [ ] **Step 4: Run tests and the live guardrail**

```powershell
node --test tooling/verification/guardrails.test.mjs
node tooling/verification/guardrails.mjs
```

Expected: all four tests pass; live output reports three private workspaces and zero leaks.

- [ ] **Step 5: Add exact root scripts**

Add:

```json
{
  "scripts": {
    "test:guardrails": "node --test tooling/verification/guardrails.test.mjs",
    "guardrails:check": "node tooling/verification/guardrails.mjs"
  }
}
```

- [ ] **Step 6: Commit guardrails**

```powershell
git add tooling/verification package.json pnpm-lock.yaml
git commit -m "test: enforce design system repository guardrails"
```

### Task 2: Add complete AI, Figma token-map, and build artifact verification

**Files:**
- Read and validate: `figma/token-map.json` from plan 04 final readback.
- Read and validate: `figma/verification.json` from plan 04 final readback.
- Create: `tooling/verification/artifacts.mjs`.
- Create: `tooling/verification/artifacts.test.mjs`.
- Modify: `package.json`.

**Interfaces:**
- Produces: `verifyBuildArtifacts(root): Promise<string[]>`.
- Produces: `verifyTokenMap(tokens, tokenMap): string[]`.
- Produces: `verifyFigmaEvidence(root): Promise<string[]>`.
- Treats `codeConnect: "skipped-v0.1"` as the only valid v0.1 Code Connect evidence.

- [ ] **Step 1: Freeze the exact live evidence contracts**

Plan 04 must have already written both Figma files from final readback. Do not invent IDs or URLs in this task.

`figma/token-map.json` has these exact top-level fields:

- `schemaVersion: 1`.
- `collections`: five entries in order `Primitives`, `Semantic Color`, `Spacing`, `Typography`, `Radius`. Every entry has non-empty `id`, `mode: { id, name: "Default" }`, and an exact `variableCount`.
- `variables`: one entry for every non-shadow AI token. Every entry has exactly `tokenName`, `tokenType`, `collection`, `collectionId`, `variableId`, `scopes`, and `webSyntax`.
- Variable collection and scopes are exact: primitive colors → `Primitives`/`[]`; semantic backgrounds/action/status → `Semantic Color`/`FRAME_FILL,SHAPE_FILL`; semantic text and `on-*` → `TEXT_FILL`; `color/icon/*` → `SHAPE_FILL,STROKE_COLOR`; border/focus → `STROKE_COLOR`; `space/*` → `Spacing`/`GAP`; `size/*` → `Spacing`/`WIDTH_HEIGHT`; typography families/sizes/line-heights/weights → their matching font scope; `radius/*` → `Radius`/`CORNER_RADIUS`.
- `styles.text`: exactly `Display`, `Heading`, `Title`, `Body/Large`, `Body`, `Body/Small`, `Caption`, `Label` with non-empty IDs.
- `styles.effect`: one entry for each shadow token with exactly `tokenName`, `name`, `styleId`, and `webSyntax`.
- The sorted union of `variables[].tokenName` and `styles.effect[].tokenName` equals the sorted 106 names in built `tokens.json` exactly once. The token map contains exactly 104 Variables, including 26 Semantic Color variables and 57 COLOR variables, plus two Effect Styles. Every `webSyntax` equals `var(${token.cssVariable})`.

`figma/verification.json` keeps the existing file/page/Foundation fields and uses these exact component evidence fields:

- `foundations.tokenParity` may be `true` only when Plan 04 readback proves the `font/family/sans` STRING equals the complete generated CSS stack; the installed `IBM Plex Sans KR` family is applied through Text Styles, not by changing the token value.
- `Icon`: `catalogUrl`, `componentCount: 5`, five `componentUrls` entries named `Icon/Check`, `Icon/ChevronRight`, `Icon/Close`, `Icon/Info`, `Icon/Search`, `properties: []`, and the three true audit booleans.
- `Badge`: `componentSetUrl`, `variantCount: 16`, `properties: [{ "name": "Label", "type": "TEXT" }]`, and the three true audit booleans.
- `Button`: `componentSetUrl`, `variantCount: 27`, exact properties `Label/TEXT`, `Loading/BOOLEAN`, `Show leading icon/BOOLEAN`, `Show trailing icon/BOOLEAN`, `Leading icon/INSTANCE_SWAP`, `Trailing icon/INSTANCE_SWAP`, and the three true audit booleans.
- `TextField`: `componentSetUrl`, `variantCount: 8`, exact `Label`, `Value`, `Description`, `Error` TEXT properties, and the three true audit booleans.
- `codeConnect` is exactly `skipped-v0.1`.
- Icon’s manifest URL equals `catalogUrl`. Badge, Button, and TextField manifest URLs equal their `componentSetUrl`. The Icon catalog, five owned Icon components, and three component sets produce nine mutually distinct node URLs.

- [ ] **Step 2: Write the complete valid fixture and negative tests**

Create `tooling/verification/artifacts.test.mjs`:

```js
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  verifyBuildArtifacts,
  verifyFigmaEvidence,
} from './artifacts.mjs';

const routes = [
  'index.html', 'principles/index.html', 'getting-started/index.html',
  'foundations/colors/index.html', 'foundations/typography/index.html',
  'foundations/spacing/index.html', 'foundations/radius/index.html',
  'foundations/elevation/index.html', 'components/icon/index.html',
  'components/badge/index.html', 'components/button/index.html',
  'components/text-field/index.html',
];

const collectionNames = ['Primitives', 'Semantic Color', 'Spacing', 'Typography', 'Radius'];
const textStyleNames = ['Display', 'Heading', 'Title', 'Body/Large', 'Body', 'Body/Small', 'Caption', 'Label'];
const pageNames = [
  '00 Cover', '01 Principles', '02 Getting Started', '03 Foundations',
  '04 Components', '04.1 Icon', '04.2 Badge', '04.3 Button',
  '04.4 TextField', '90 Native Differences', '99 Deprecated',
];

const componentSpecs = [
  {
    name: 'Icon', slug: 'icon',
    variants: ['check', 'chevron-right', 'close', 'info', 'search'],
    sizes: ['16', '20', '24'],
    states: ['decorative', 'labelled'],
  },
  {
    name: 'Badge', slug: 'badge',
    variants: ['soft', 'solid', 'neutral', 'primary', 'success', 'danger'],
    sizes: ['small', 'medium'], states: ['default'],
  },
  {
    name: 'Button', slug: 'button', variants: ['fill', 'weak', 'outline'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'hover', 'pressed', 'focus-visible', 'disabled', 'loading'],
  },
  {
    name: 'TextField', slug: 'text-field', variants: [],
    sizes: ['medium', 'large'], states: ['default', 'focus', 'error', 'disabled'],
  },
];

const properties = {
  Icon: [],
  Badge: [{ name: 'Label', type: 'TEXT' }],
  Button: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Loading', type: 'BOOLEAN' },
    { name: 'Show leading icon', type: 'BOOLEAN' },
    { name: 'Show trailing icon', type: 'BOOLEAN' },
    { name: 'Leading icon', type: 'INSTANCE_SWAP' },
    { name: 'Trailing icon', type: 'INSTANCE_SWAP' },
  ],
  TextField: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Value', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
};

function figmaUrl(id) {
  return `https://www.figma.com/design/file?node-id=${encodeURIComponent(id)}`;
}

function makeTokens() {
  return Array.from({ length: 106 }, (_, index) => {
    const kind = index < 80 ? 'primitive' : 'semantic';
    let name;
    let type;
    if (index < 31) {
      name = `color/primitive/${index + 1}`;
      type = 'color';
    } else if (index < 43) {
      name = `space/${index - 30}`;
      type = 'dimension';
    } else if (index < 51) {
      name = `size/control/${index - 42}`;
      type = 'dimension';
    } else if (index < 57) {
      name = `radius/${index - 50}`;
      type = 'dimension';
    } else if (index < 65) {
      name = `font/size/${index - 56}`;
      type = 'dimension';
    } else if (index < 73) {
      name = `font/line-height/${index - 64}`;
      type = 'dimension';
    } else if (index < 77) {
      name = `font/weight/${index - 72}`;
      type = 'fontWeight';
    } else if (index === 77) {
      name = 'font/family/sans';
      type = 'fontFamily';
    } else if (index < 80) {
      name = `elevation/${index - 77}`;
      type = 'shadow';
    } else {
      name = index === 80 ? 'color/icon/primary' : `color/semantic/${index - 80}`;
      type = 'color';
    }
    const primitiveValue = type === 'fontFamily'
      ? '"IBM Plex Sans KR", "Noto Sans KR", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      : type === 'fontWeight'
        ? 600
        : type === 'dimension'
      ? index + 1
      : type === 'shadow'
        ? '0 1px 2px rgba(0, 0, 0, 0.1)'
        : '#112233';
    return {
      name,
      type,
      kind,
      value: kind === 'semantic' ? `{color/primitive/${(index % 31) + 1}}` : primitiveValue,
      description: `token ${index + 1} description`,
      cssVariable: `--ds-${name.replaceAll('/', '-')}`,
      resolvedValue: primitiveValue,
    };
  });
}

function collectionFor(token) {
  if (token.kind === 'semantic') return 'Semantic Color';
  if (token.name.startsWith('space/')) return 'Spacing';
  if (token.name.startsWith('font/')) return 'Typography';
  if (token.name.startsWith('radius/')) return 'Radius';
  return 'Primitives';
}

function scopesFor(token, collection) {
  if (collection === 'Primitives') return [];
  if (collection === 'Radius') return ['CORNER_RADIUS'];
  if (collection === 'Spacing') {
    return token.name.startsWith('size/') ? ['WIDTH_HEIGHT'] : ['GAP'];
  }
  if (collection === 'Typography') {
    if (token.name.startsWith('font/family/')) return ['FONT_FAMILY'];
    if (token.name.startsWith('font/weight/')) return ['FONT_WEIGHT'];
    if (token.name.startsWith('font/line-height/')) return ['LINE_HEIGHT'];
    return ['FONT_SIZE'];
  }
  if (token.name.startsWith('color/text/') || token.name.includes('/on-')) return ['TEXT_FILL'];
  if (token.name.startsWith('color/icon/')) return ['SHAPE_FILL', 'STROKE_COLOR'];
  if (token.name.startsWith('color/border/') || token.name.startsWith('color/focus/')) return ['STROKE_COLOR'];
  return ['FRAME_FILL', 'SHAPE_FILL'];
}

function makeTokenMap(tokens) {
  const collectionIds = Object.fromEntries(
    collectionNames.map((name, index) => [name, `collection:${index + 1}`]),
  );
  const variables = tokens
    .filter(({ type }) => type !== 'shadow')
    .map((token, index) => {
      const collection = collectionFor(token);
      return {
        tokenName: token.name,
        tokenType: token.type,
        collection,
        collectionId: collectionIds[collection],
        variableId: `variable:${index + 1}`,
        scopes: scopesFor(token, collection),
        webSyntax: `var(${token.cssVariable})`,
      };
    });
  return {
    schemaVersion: 1,
    collections: collectionNames.map((name, index) => ({
      name,
      id: collectionIds[name],
      mode: { id: `mode:${index + 1}`, name: 'Default' },
      variableCount: variables.filter((variable) => variable.collection === name).length,
    })),
    variables,
    styles: {
      text: textStyleNames.map((name, index) => ({ name, id: `text-style:${index + 1}` })),
      effect: tokens
        .filter(({ type }) => type === 'shadow')
        .map((token, index) => ({
          tokenName: token.name,
          name: `Shadow/${index + 1}`,
          styleId: `effect-style:${index + 1}`,
          webSyntax: `var(${token.cssVariable})`,
        })),
    },
  };
}

function makeManifest() {
  return componentSpecs.map(({ name, slug, variants, sizes, states }) => ({
    name,
    slug,
    description: `${name} purpose`,
    status: 'preview',
    figmaUrl: figmaUrl(name === 'Icon' ? 'icon-catalog' : `${slug}-set`),
    frameworks: { react: 'preview', svelte: 'planned', reactNative: 'planned' },
    variants,
    sizes,
    states,
    accessibility: `${name} accessibility contract`,
    props: [{
      name: 'example',
      type: 'string',
      required: false,
      defaultValue: null,
      description: 'Example property',
    }],
    tokens: [name === 'Icon' ? 'color/icon/primary' : 'color/text/primary'],
    docsUrl: `/components/${slug}/`,
  }));
}

function makeVerification() {
  const shared = {
    screenshotReviewed: true,
    bindingsAudited: true,
    propParity: true,
  };
  return {
    schemaVersion: 1,
    fileUrl: 'https://www.figma.com/design/file',
    verifiedAt: '2026-07-10T03:00:00.000Z',
    codeConnect: 'skipped-v0.1',
    collections: collectionNames,
    textStyleCount: 8,
    effectStyleCount: 2,
    pages: pageNames,
    components: {
      Icon: {
        catalogUrl: figmaUrl('icon-catalog'),
        componentCount: 5,
        componentUrls: ['Icon/Check', 'Icon/ChevronRight', 'Icon/Close', 'Icon/Info', 'Icon/Search']
          .map((name, index) => ({ name, url: figmaUrl(`icon-${index + 1}`) })),
        properties: properties.Icon,
        ...shared,
      },
      Badge: {
        componentSetUrl: figmaUrl('badge-set'),
        variantCount: 16,
        properties: properties.Badge,
        ...shared,
      },
      Button: {
        componentSetUrl: figmaUrl('button-set'),
        variantCount: 27,
        properties: properties.Button,
        ...shared,
      },
      TextField: {
        componentSetUrl: figmaUrl('text-field-set'),
        variantCount: 8,
        properties: properties.TextField,
        ...shared,
      },
    },
    foundations: {
      approved: true,
      approvedAt: '2026-07-10T02:00:00.000Z',
      tokenParity: true,
    },
    pageScreenshotNodeIds: Object.fromEntries(
      pageNames.map((page, index) => [page, `page:${index + 1}`]),
    ),
    allPagesScreenshotReviewed: true,
    hardCodedProductValues: 0,
  };
}

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-artifacts-'));
  const dist = path.join(root, 'apps', 'docs', 'dist');
  for (const relative of routes) {
    const file = path.join(dist, relative);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, '<!doctype html><h1>ok</h1>');
  }
  const tokens = makeTokens();
  const jsonDir = path.join(dist, 'design-system');
  await mkdir(jsonDir, { recursive: true });
  await writeFile(path.join(jsonDir, 'tokens.json'), JSON.stringify({
    schemaVersion: 1,
    tokens,
  }));
  await writeFile(path.join(jsonDir, 'components.json'), JSON.stringify({
    schemaVersion: 1,
    components: makeManifest(),
  }));
  const figmaDir = path.join(root, 'figma');
  await mkdir(figmaDir, { recursive: true });
  await writeFile(path.join(figmaDir, 'token-map.json'), JSON.stringify(makeTokenMap(tokens)));
  await writeFile(path.join(figmaDir, 'verification.json'), JSON.stringify(makeVerification()));
  return root;
}

test('accepts a complete build, 106-token map, manifest, and Figma evidence', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(await verifyBuildArtifacts(root), []);
  assert.deepEqual(await verifyFigmaEvidence(root), []);
});

test('reports a missing static route', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await rm(path.join(root, 'apps', 'docs', 'dist', 'components', 'icon', 'index.html'));
  assert.ok((await verifyBuildArtifacts(root))
    .some((value) => value.includes('components/icon/index.html')));
});

test('rejects token count, kind, cssVariable, and resolvedValue drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'tokens.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.tokens.pop();
  artifact.tokens[0].kind = 'other';
  artifact.tokens[1].cssVariable = '--wrong';
  delete artifact.tokens[2].resolvedValue;
  await writeFile(file, JSON.stringify(artifact));
  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.some((value) => value.includes('exactly 106 tokens')));
  assert.ok(violations.some((value) => value.includes('invalid kind')));
  assert.ok(violations.some((value) => value.includes('cssVariable mismatch')));
  assert.ok(violations.some((value) => value.includes('missing resolvedValue')));
});

test('rejects component order, status, full-field, prop, and distinct-URL drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.components.reverse();
  artifact.components[0].status = 'stable';
  artifact.components[0].description = '';
  delete artifact.components[1].accessibility;
  artifact.components[1].variants = 'default';
  artifact.components[2].props[0].required = 'false';
  artifact.components[2].tokens = [];
  artifact.components[3].figmaUrl = artifact.components[2].figmaUrl;
  await writeFile(file, JSON.stringify(artifact));
  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.some((value) => value.includes('Component index 0 must be Icon')));
  assert.ok(violations.some((value) => value.includes('status must be preview')));
  assert.ok(violations.some((value) => value.includes('description must be non-empty')));
  assert.ok(violations.some((value) => value.includes('missing accessibility')));
  assert.ok(violations.some((value) => value.includes('variants must be a string array')));
  assert.ok(violations.some((value) => value.includes('prop 0 required must be boolean')));
  assert.ok(violations.some((value) => value.includes('tokens must be a non-empty string array')));
  assert.ok(violations.some((value) => value.includes('four distinct Figma URLs')));
});

test('rejects incomplete token-map equality and WEB syntax', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'token-map.json');
  const tokenMap = JSON.parse(await readFile(file, 'utf8'));
  tokenMap.variables[0].webSyntax = 'var(--wrong)';
  delete tokenMap.variables[1].collectionId;
  tokenMap.variables[2].scopes = ['ALL_SCOPES'];
  tokenMap.variables.pop();
  await writeFile(file, JSON.stringify(tokenMap));
  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('token-name mapping must equal tokens.json')));
  assert.ok(violations.some((value) => value.includes('WEB syntax mismatch')));
  assert.ok(violations.some((value) => value.includes('variable fields mismatch')));
  assert.ok(violations.some((value) => value.includes('scopes mismatch')));
});

test('rejects exact Figma counts, Icon URLs, and property definitions', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.components.Icon.componentCount = 4;
  evidence.components.Icon.componentUrls.pop();
  evidence.components.Badge.properties = [];
  evidence.components.Badge.variantCount = 15;
  evidence.components.Button.variantCount = 26;
  evidence.components.Button.properties[1].type = 'TEXT';
  evidence.components.TextField.variantCount = 7;
  evidence.components.TextField.properties.pop();
  await writeFile(file, JSON.stringify(evidence));
  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('Icon componentCount must be 5')));
  assert.ok(violations.some((value) => value.includes('Icon componentUrls must contain five exact icons')));
  assert.ok(violations.some((value) => value.includes('Badge property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Badge variantCount must be 16')));
  assert.ok(violations.some((value) => value.includes('Button variantCount must be 27')));
  assert.ok(violations.some((value) => value.includes('Button property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('TextField variantCount must be 8')));
  assert.ok(violations.some((value) => value.includes('TextField property definitions mismatch')));
});

test('rejects approval, Code Connect, screenshot, hard-code, and URL mapping drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const evidenceFile = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'));
  evidence.codeConnect = 'published';
  evidence.foundations.approved = false;
  delete evidence.pageScreenshotNodeIds['04.2 Badge'];
  evidence.hardCodedProductValues = 1;
  await writeFile(evidenceFile, JSON.stringify(evidence));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.components[0].figmaUrl = figmaUrl('different');
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('Code Connect must be skipped-v0.1')));
  assert.ok(violations.some((value) => value.includes('Foundations approval')));
  assert.ok(violations.some((value) => value.includes('04.2 Badge screenshot node')));
  assert.ok(violations.some((value) => value.includes('hard-coded product values')));
  assert.ok(violations.some((value) => value.includes('Icon manifest Figma URL')));
});
```

- [ ] **Step 3: Run tests and confirm the missing-module failure**

Run: `node --test tooling/verification/artifacts.test.mjs`

Expected: FAIL because `artifacts.mjs` is absent.

- [ ] **Step 4: Implement complete artifact, manifest, token-map, and Figma verification**

Create `tooling/verification/artifacts.mjs`:

```js
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const routes = [
  'index.html',
  'principles/index.html',
  'getting-started/index.html',
  'foundations/colors/index.html',
  'foundations/typography/index.html',
  'foundations/spacing/index.html',
  'foundations/radius/index.html',
  'foundations/elevation/index.html',
  'components/icon/index.html',
  'components/badge/index.html',
  'components/button/index.html',
  'components/text-field/index.html',
  'design-system/tokens.json',
  'design-system/components.json',
];

const tokenKeys = ['cssVariable', 'description', 'kind', 'name', 'resolvedValue', 'type', 'value'];
const tokenTypes = new Set(['color', 'dimension', 'fontFamily', 'fontWeight', 'shadow']);
const tokenKinds = new Set(['primitive', 'semantic']);
const componentKeys = [
  'accessibility', 'description', 'docsUrl', 'figmaUrl', 'frameworks', 'name',
  'props', 'sizes', 'slug', 'states', 'status', 'tokens', 'variants',
];
const propKeys = ['defaultValue', 'description', 'name', 'required', 'type'];
const collectionNames = ['Primitives', 'Semantic Color', 'Spacing', 'Typography', 'Radius'];
const textStyleNames = ['Display', 'Heading', 'Title', 'Body/Large', 'Body', 'Body/Small', 'Caption', 'Label'];
const pageNames = [
  '00 Cover', '01 Principles', '02 Getting Started', '03 Foundations',
  '04 Components', '04.1 Icon', '04.2 Badge', '04.3 Button',
  '04.4 TextField', '90 Native Differences', '99 Deprecated',
];
const componentSpecs = [
  {
    name: 'Icon', slug: 'icon', componentCount: 5, properties: [],
    variants: ['check', 'chevron-right', 'close', 'info', 'search'],
    sizes: ['16', '20', '24'], states: ['decorative', 'labelled'],
  },
  {
    name: 'Badge',
    slug: 'badge',
    variantCount: 16,
    properties: [{ name: 'Label', type: 'TEXT' }],
    variants: ['soft', 'solid', 'neutral', 'primary', 'success', 'danger'],
    sizes: ['small', 'medium'],
    states: ['default'],
  },
  {
    name: 'Button',
    slug: 'button',
    variantCount: 27,
    properties: [
      { name: 'Label', type: 'TEXT' },
      { name: 'Loading', type: 'BOOLEAN' },
      { name: 'Show leading icon', type: 'BOOLEAN' },
      { name: 'Show trailing icon', type: 'BOOLEAN' },
      { name: 'Leading icon', type: 'INSTANCE_SWAP' },
      { name: 'Trailing icon', type: 'INSTANCE_SWAP' },
    ],
    variants: ['fill', 'weak', 'outline'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'hover', 'pressed', 'focus-visible', 'disabled', 'loading'],
  },
  {
    name: 'TextField',
    slug: 'text-field',
    variantCount: 8,
    properties: [
      { name: 'Label', type: 'TEXT' },
      { name: 'Value', type: 'TEXT' },
      { name: 'Description', type: 'TEXT' },
      { name: 'Error', type: 'TEXT' },
    ],
    variants: [],
    sizes: ['medium', 'large'],
    states: ['default', 'focus', 'error', 'disabled'],
  },
];
const iconNames = ['Icon/Check', 'Icon/ChevronRight', 'Icon/Close', 'Icon/Info', 'Icon/Search'];

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

function exactKeys(value, expected) {
  return value
    && typeof value === 'object'
    && !Array.isArray(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
}

function nonEmpty(value) {
  return typeof value === 'string' && value.length > 0;
}

function figmaNodeUrl(value) {
  return nonEmpty(value)
    && value.startsWith('https://www.figma.com/design/')
    && value.includes('node-id=');
}

function expectedCollection(token) {
  if (token.kind === 'semantic') return 'Semantic Color';
  if (token.name.startsWith('space/') || token.name.startsWith('size/')) return 'Spacing';
  if (token.name.startsWith('font/')) return 'Typography';
  if (token.name.startsWith('radius/')) return 'Radius';
  return 'Primitives';
}

function expectedScopes(token) {
  const collection = expectedCollection(token);
  if (collection === 'Primitives') return [];
  if (collection === 'Radius') return ['CORNER_RADIUS'];
  if (collection === 'Spacing') {
    return token.name.startsWith('size/') ? ['WIDTH_HEIGHT'] : ['GAP'];
  }
  if (collection === 'Typography') {
    if (token.name.startsWith('font/family/')) return ['FONT_FAMILY'];
    if (token.name.startsWith('font/weight/')) return ['FONT_WEIGHT'];
    if (token.name.startsWith('font/line-height/')) return ['LINE_HEIGHT'];
    return ['FONT_SIZE'];
  }
  if (token.name.startsWith('color/text/') || token.name.includes('/on-')) return ['TEXT_FILL'];
  if (token.name.startsWith('color/icon/')) return ['SHAPE_FILL', 'STROKE_COLOR'];
  if (token.name.startsWith('color/border/') || token.name.startsWith('color/focus/')) return ['STROKE_COLOR'];
  return ['FRAME_FILL', 'SHAPE_FILL'];
}

function validateTokensArtifact(artifact) {
  const violations = [];
  if (!exactKeys(artifact, ['schemaVersion', 'tokens'])) violations.push('tokens.json envelope fields mismatch');
  if (artifact?.schemaVersion !== 1) violations.push('tokens.json schemaVersion must be 1');
  if (!Array.isArray(artifact?.tokens)) {
    violations.push('tokens.json must contain tokens');
    return violations;
  }
  if (artifact.tokens.length !== 106) violations.push('tokens.json must contain exactly 106 tokens');
  const names = new Set();
  const cssVariables = new Set();
  let primitiveCount = 0;
  let semanticCount = 0;
  artifact.tokens.forEach((token, index) => {
    const label = token?.name ?? `index ${index}`;
    if (!exactKeys(token, tokenKeys)) {
      for (const key of tokenKeys) {
        if (!(key in (token ?? {}))) violations.push(`Token ${label} missing ${key}`);
      }
      const extras = Object.keys(token ?? {}).filter((key) => !tokenKeys.includes(key));
      if (extras.length) violations.push(`Token ${label} has unknown fields: ${extras.join(', ')}`);
    }
    if (!nonEmpty(token?.name)) violations.push(`Token index ${index} name must be non-empty`);
    if (!tokenTypes.has(token?.type)) violations.push(`Token ${label} invalid type`);
    if (!tokenKinds.has(token?.kind)) violations.push(`Token ${label} invalid kind`);
    if (!['string', 'number'].includes(typeof token?.value)) violations.push(`Token ${label} value must be string or number`);
    if (!nonEmpty(token?.description)) violations.push(`Token ${label} description must be non-empty`);
    if (!['string', 'number'].includes(typeof token?.resolvedValue)) {
      violations.push(`Token ${label} missing resolvedValue`);
    }
    const expectedCss = nonEmpty(token?.name) ? `--ds-${token.name.replaceAll('/', '-')}` : '';
    if (token?.cssVariable !== expectedCss) violations.push(`Token ${label} cssVariable mismatch`);
    if (names.has(token?.name)) violations.push(`Duplicate token name: ${token.name}`);
    if (cssVariables.has(token?.cssVariable)) violations.push(`Duplicate cssVariable: ${token.cssVariable}`);
    names.add(token?.name);
    cssVariables.add(token?.cssVariable);
    if (token?.kind === 'primitive') primitiveCount += 1;
    if (token?.kind === 'semantic') semanticCount += 1;
  });
  if (primitiveCount !== 80) violations.push('tokens.json must contain exactly 80 primitive tokens');
  if (semanticCount !== 26) violations.push('tokens.json must contain exactly 26 semantic tokens');
  return violations;
}

function validateComponentsArtifact(artifact) {
  const violations = [];
  if (!exactKeys(artifact, ['schemaVersion', 'components'])) violations.push('components.json envelope fields mismatch');
  if (artifact?.schemaVersion !== 1) violations.push('components.json schemaVersion must be 1');
  if (!Array.isArray(artifact?.components)) {
    violations.push('components.json must contain components');
    return violations;
  }
  if (artifact.components.length !== 4) violations.push('components.json must contain exactly 4 components');
  const figmaUrls = [];
  componentSpecs.forEach(({ name, slug, variants, sizes, states }, index) => {
    const component = artifact.components[index];
    if (!component || component.name !== name) violations.push(`Component index ${index} must be ${name}`);
    if (!component || component.slug !== slug) violations.push(`${name} slug must be ${slug}`);
    if (!exactKeys(component, componentKeys)) {
      for (const key of componentKeys) {
        if (!(key in (component ?? {}))) violations.push(`${name} missing ${key}`);
      }
      const extras = Object.keys(component ?? {}).filter((key) => !componentKeys.includes(key));
      if (extras.length) violations.push(`${name} has unknown fields: ${extras.join(', ')}`);
    }
    if (component?.docsUrl !== `/components/${slug}/`) violations.push(`${name} docsUrl mismatch`);
    if (component?.status !== 'preview') violations.push(`${name} status must be preview`);
    if (!nonEmpty(component?.description)) violations.push(`${name} description must be non-empty`);
    if (!nonEmpty(component?.accessibility)) violations.push(`${name} accessibility must be non-empty`);
    if (!figmaNodeUrl(component?.figmaUrl)) violations.push(`${name} requires a Figma node URL`);
    else figmaUrls.push(component.figmaUrl);
    if (JSON.stringify(component?.frameworks) !== JSON.stringify({
      react: 'preview',
      svelte: 'planned',
      reactNative: 'planned',
    })) violations.push(`${name} framework statuses mismatch`);
    for (const key of ['variants', 'sizes', 'states']) {
      if (!Array.isArray(component?.[key])
        || component[key].some((value) => typeof value !== 'string')) {
        violations.push(`${name} ${key} must be a string array`);
      }
    }
    for (const [key, expected] of Object.entries({ variants, sizes, states })) {
      if (JSON.stringify(component?.[key]) !== JSON.stringify(expected)) {
        violations.push(`${name} ${key} mismatch`);
      }
    }
    if (!Array.isArray(component?.tokens)
      || component.tokens.length === 0
      || component.tokens.some((value) => typeof value !== 'string')) {
      violations.push(`${name} tokens must be a non-empty string array`);
    }
    if (!Array.isArray(component?.props)) {
      violations.push(`${name} props must be an array`);
    } else {
      component.props.forEach((prop, propIndex) => {
        if (!exactKeys(prop, propKeys)) violations.push(`${name} prop ${propIndex} fields mismatch`);
        if (!nonEmpty(prop?.name)) violations.push(`${name} prop ${propIndex} name must be non-empty`);
        if (typeof prop?.type !== 'string') violations.push(`${name} prop ${propIndex} type must be string`);
        if (typeof prop?.required !== 'boolean') violations.push(`${name} prop ${propIndex} required must be boolean`);
        if (!(prop?.defaultValue === null || typeof prop?.defaultValue === 'string')) {
          violations.push(`${name} prop ${propIndex} defaultValue must be string or null`);
        }
        if (!nonEmpty(prop?.description)) violations.push(`${name} prop ${propIndex} description must be non-empty`);
      });
    }
  });
  if (figmaUrls.length !== 4 || new Set(figmaUrls).size !== 4) {
    violations.push('components.json must contain four distinct Figma URLs');
  }
  return violations;
}

export function verifyTokenMap(tokens, tokenMap) {
  const violations = [];
  if (!exactKeys(tokenMap, ['schemaVersion', 'collections', 'variables', 'styles'])) {
    violations.push('token-map top-level fields mismatch');
  }
  if (!exactKeys(tokenMap?.styles, ['text', 'effect'])) violations.push('token-map style fields mismatch');
  if (tokenMap?.schemaVersion !== 1) violations.push('token-map schemaVersion must be 1');
  if (JSON.stringify(tokenMap?.collections?.map(({ name }) => name)) !== JSON.stringify(collectionNames)) {
    violations.push('token-map collection list mismatch');
  }
  const collectionByName = new Map();
  for (const collection of tokenMap?.collections ?? []) {
    if (!exactKeys(collection, ['name', 'id', 'mode', 'variableCount'])
      || !exactKeys(collection.mode, ['id', 'name'])) {
      violations.push(`${collection.name} collection fields mismatch`);
    }
    collectionByName.set(collection.name, collection);
    if (!nonEmpty(collection.id)) violations.push(`${collection.name} collection ID is required`);
    if (!nonEmpty(collection.mode?.id) || collection.mode?.name !== 'Default') {
      violations.push(`${collection.name} Default mode evidence is invalid`);
    }
  }
  if (!Array.isArray(tokenMap?.variables)) violations.push('token-map variables must be an array');
  if (!Array.isArray(tokenMap?.styles?.text)) violations.push('token-map text styles must be an array');
  if (!Array.isArray(tokenMap?.styles?.effect)) violations.push('token-map effect styles must be an array');

  const variables = tokenMap?.variables ?? [];
  const effects = tokenMap?.styles?.effect ?? [];
  const tokenByName = new Map(tokens.map((token) => [token.name, token]));
  const mappedNames = [...variables.map(({ tokenName }) => tokenName), ...effects.map(({ tokenName }) => tokenName)];
  const expectedNames = tokens.map(({ name }) => name);
  if (variables.length !== 104) violations.push('token-map must contain exactly 104 variables');
  if (variables.filter(({ tokenName }) => tokenByName.get(tokenName)?.kind === 'semantic').length !== 26) {
    violations.push('token-map must contain exactly 26 Semantic Color variables');
  }
  if (variables.filter(({ tokenName }) => tokenByName.get(tokenName)?.type === 'color').length !== 57) {
    violations.push('token-map must contain exactly 57 COLOR variables');
  }
  if (mappedNames.length !== 106
    || new Set(mappedNames).size !== 106
    || JSON.stringify([...mappedNames].sort()) !== JSON.stringify([...expectedNames].sort())) {
    violations.push('token-map token-name mapping must equal tokens.json');
  }

  for (const variable of variables) {
    if (!exactKeys(variable, [
      'tokenName', 'tokenType', 'collection', 'collectionId',
      'variableId', 'scopes', 'webSyntax',
    ])) violations.push(`${variable.tokenName} variable fields mismatch`);
    const token = tokenByName.get(variable.tokenName);
    if (!token) {
      violations.push(`Unknown token-map variable: ${variable.tokenName}`);
      continue;
    }
    if (token.type === 'shadow') violations.push(`Shadow token ${token.name} must map to an effect style`);
    if (variable.tokenType !== token.type) violations.push(`${token.name} tokenType mismatch`);
    if (variable.webSyntax !== `var(${token.cssVariable})`) violations.push(`${token.name} WEB syntax mismatch`);
    const expectedCollectionName = expectedCollection(token);
    const collection = collectionByName.get(variable.collection);
    if (variable.collection !== expectedCollectionName
      || !collection
      || variable.collectionId !== collection.id) {
      violations.push(`${token.name} collection mapping mismatch`);
    }
    if (!nonEmpty(variable.variableId)) violations.push(`${token.name} variableId is required`);
    if (JSON.stringify(variable.scopes) !== JSON.stringify(expectedScopes(token))) {
      violations.push(`${token.name} scopes mismatch`);
    }
  }

  for (const collection of tokenMap?.collections ?? []) {
    const actual = variables.filter((variable) => variable.collection === collection.name).length;
    if (collection.variableCount !== actual) {
      violations.push(`${collection.name} variableCount must be ${actual}`);
    }
  }

  if (JSON.stringify(tokenMap?.styles?.text?.map(({ name }) => name)) !== JSON.stringify(textStyleNames)) {
    violations.push('token-map text style list mismatch');
  }
  for (const style of tokenMap?.styles?.text ?? []) {
    if (!exactKeys(style, ['name', 'id'])) violations.push(`${style.name} text style fields mismatch`);
    if (!nonEmpty(style.id)) violations.push(`Text style ${style.name} ID is required`);
  }
  const shadowTokens = tokens.filter(({ type }) => type === 'shadow');
  if (effects.length !== shadowTokens.length) violations.push('token-map effect style count mismatch');
  effects.forEach((effect, index) => {
    if (!exactKeys(effect, ['tokenName', 'name', 'styleId', 'webSyntax'])) {
      violations.push(`${effect.tokenName} effect style fields mismatch`);
    }
    const token = tokenByName.get(effect.tokenName);
    if (!token || token.type !== 'shadow') violations.push(`Effect style ${effect.tokenName} must map a shadow token`);
    if (effect.tokenName !== shadowTokens[index]?.name || effect.name !== `Shadow/${index + 1}`) {
      violations.push(`Effect style index ${index} mapping mismatch`);
    }
    if (!nonEmpty(effect.name) || !nonEmpty(effect.styleId)) {
      violations.push(`Effect style ${effect.tokenName} metadata is incomplete`);
    }
    if (token && effect.webSyntax !== `var(${token.cssVariable})`) {
      violations.push(`${token.name} WEB syntax mismatch`);
    }
  });
  return violations;
}

export async function verifyBuildArtifacts(root) {
  const dist = path.join(root, 'apps', 'docs', 'dist');
  const violations = [];
  for (const relative of routes) {
    try {
      await access(path.join(dist, relative));
    } catch {
      violations.push(`Missing build artifact: ${relative}`);
    }
  }
  const tokens = await json(path.join(dist, 'design-system', 'tokens.json'));
  const manifest = await json(path.join(dist, 'design-system', 'components.json'));
  violations.push(...validateTokensArtifact(tokens));
  violations.push(...validateComponentsArtifact(manifest));
  return violations.sort();
}

export async function verifyFigmaEvidence(root) {
  const tokensArtifact = await json(path.join(root, 'apps', 'docs', 'dist', 'design-system', 'tokens.json'));
  const tokenMap = await json(path.join(root, 'figma', 'token-map.json'));
  const evidence = await json(path.join(root, 'figma', 'verification.json'));
  const manifest = await json(path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json'));
  const violations = verifyTokenMap(tokensArtifact.tokens ?? [], tokenMap);

  if (!exactKeys(evidence, [
    'schemaVersion', 'fileUrl', 'verifiedAt', 'codeConnect', 'collections',
    'textStyleCount', 'effectStyleCount', 'pages', 'components', 'foundations',
    'pageScreenshotNodeIds', 'allPagesScreenshotReviewed', 'hardCodedProductValues',
  ])) violations.push('Figma evidence top-level fields mismatch');
  if (evidence.schemaVersion !== 1) violations.push('Figma schemaVersion must be 1');
  if (!nonEmpty(evidence.fileUrl) || !evidence.fileUrl.startsWith('https://www.figma.com/design/')) {
    violations.push('Figma fileUrl is invalid');
  }
  if (!Number.isFinite(Date.parse(evidence.verifiedAt ?? ''))) violations.push('Figma verifiedAt must be an ISO timestamp');
  if (evidence.codeConnect !== 'skipped-v0.1') violations.push('Code Connect must be skipped-v0.1');
  if (JSON.stringify(evidence.collections) !== JSON.stringify(collectionNames)) violations.push('Figma collection list mismatch');
  if (evidence.textStyleCount !== 8) violations.push('Figma textStyleCount must be 8');
  if (evidence.effectStyleCount !== 2) violations.push('Figma effectStyleCount must be 2');
  if (JSON.stringify(evidence.pages) !== JSON.stringify(pageNames)) violations.push('Figma page list mismatch');
  if (!exactKeys(evidence.foundations, ['approved', 'approvedAt', 'tokenParity'])) {
    violations.push('Foundations evidence fields mismatch');
  }
  if (evidence.foundations?.approved !== true
    || !Number.isFinite(Date.parse(evidence.foundations?.approvedAt ?? ''))) {
    violations.push('Foundations approval evidence is incomplete');
  }
  if (evidence.foundations?.tokenParity !== true) violations.push('Foundations token parity must be true');
  if (evidence.allPagesScreenshotReviewed !== true) violations.push('Every Figma page screenshot must be reviewed');
  if (JSON.stringify(Object.keys(evidence.pageScreenshotNodeIds ?? {}).sort())
    !== JSON.stringify([...pageNames].sort())) {
    violations.push('Figma screenshot node map must contain exactly all pages');
  }
  for (const page of pageNames) {
    if (!nonEmpty(evidence.pageScreenshotNodeIds?.[page])) {
      violations.push(`${page} screenshot node ID is required`);
    }
  }
  if (evidence.hardCodedProductValues !== 0) violations.push('Figma hard-coded product values must be 0');

  const manifestTargets = [];
  for (const spec of componentSpecs) {
    const component = evidence.components?.[spec.name];
    if (!component) {
      violations.push(`Missing Figma evidence: ${spec.name}`);
      continue;
    }
    const expectedEvidenceKeys = spec.name === 'Icon'
      ? ['catalogUrl', 'componentCount', 'componentUrls', 'properties', 'screenshotReviewed', 'bindingsAudited', 'propParity']
      : ['componentSetUrl', 'variantCount', 'properties', 'screenshotReviewed', 'bindingsAudited', 'propParity'];
    if (!exactKeys(component, expectedEvidenceKeys)) {
      violations.push(`${spec.name} evidence fields mismatch`);
    }
    const targetUrl = spec.name === 'Icon' ? component.catalogUrl : component.componentSetUrl;
    if (!figmaNodeUrl(targetUrl)) violations.push(`${spec.name} Figma target URL is invalid`);
    else manifestTargets.push(targetUrl);

    if (spec.name === 'Icon') {
      if (component.componentCount !== 5) violations.push('Icon componentCount must be 5');
      const iconUrls = component.componentUrls ?? [];
      if (iconUrls.length !== 5
        || JSON.stringify(iconUrls.map(({ name }) => name)) !== JSON.stringify(iconNames)
        || iconUrls.some((entry) => !exactKeys(entry, ['name', 'url']))
        || new Set(iconUrls.map(({ url }) => url)).size !== 5
        || iconUrls.some(({ url }) => !figmaNodeUrl(url))) {
        violations.push('Icon componentUrls must contain five exact icons');
      }
    } else if (component.variantCount !== spec.variantCount) {
      violations.push(`${spec.name} variantCount must be ${spec.variantCount}`);
    }

    if (JSON.stringify(component.properties) !== JSON.stringify(spec.properties)) {
      violations.push(`${spec.name} property definitions mismatch`);
    }
    for (const key of ['screenshotReviewed', 'bindingsAudited', 'propParity']) {
      if (component[key] !== true) violations.push(`${spec.name} ${key} must be true`);
    }

    const manifestEntry = manifest.components?.find((entry) => entry.slug === spec.slug);
    if (manifestEntry?.figmaUrl !== targetUrl) {
      violations.push(`${spec.name} manifest Figma URL must match readback evidence`);
    }
  }

  if (manifestTargets.length !== 4 || new Set(manifestTargets).size !== 4) {
    violations.push('Figma evidence must expose four distinct manifest target URLs');
  }
  const ownedIconUrls = evidence.components?.Icon?.componentUrls?.map(({ url }) => url) ?? [];
  const allEvidenceUrls = [...manifestTargets, ...ownedIconUrls];
  if (allEvidenceUrls.length !== 9 || new Set(allEvidenceUrls).size !== 9) {
    violations.push('Figma evidence must expose nine distinct documentation/component node URLs');
  }
  return violations.sort();
}

async function main() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const violations = [
    ...(await verifyBuildArtifacts(root)),
    ...(await verifyFigmaEvidence(root)),
  ];
  if (violations.length) {
    process.stderr.write(`${violations.join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Artifact verification passed: static routes, complete AI JSON, token-map equality, and Figma evidence\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
```

- [ ] **Step 5: Run tests and live verification**

```powershell
node --test tooling/verification/artifacts.test.mjs
corepack pnpm build
node tooling/verification/artifacts.mjs
```

Expected: seven artifact tests pass. Live verification reports zero violations for 12 HTML routes, both AI files, exactly 106 tokens with 80/26 kinds, the complete four-component manifest, all 106 Figma token mappings (104 Variables and two Effect Styles), exact Figma counts/properties/URLs, and `codeConnect: skipped-v0.1`.

- [ ] **Step 6: Add root scripts and commit**

Expand `test:guardrails` to both explicit test files, add `artifacts:check`, and include it in `verify` after `build` and before `test:e2e`. Explicit paths avoid depending on Windows shell glob expansion:

```json
{
  "scripts": {
    "test:guardrails": "node --test tooling/verification/guardrails.test.mjs tooling/verification/artifacts.test.mjs",
    "artifacts:check": "node tooling/verification/artifacts.mjs",
    "verify": "pnpm run check && pnpm run test && pnpm run test:guardrails && pnpm run generated:check && pnpm run guardrails:check && pnpm run build && pnpm run artifacts:check && pnpm run test:e2e"
  }
}
```

```powershell
git add figma/token-map.json figma/verification.json tooling/verification package.json pnpm-lock.yaml
git commit -m "test: add complete design system artifact verification"
```

### Task 3: Run fresh final verification and confirm Public repository state

**Files:**
- Modify only after all verification passes: `docs/superpowers/specs/2026-07-10-ai-readable-design-system-v0.1-design.md`

- [ ] **Step 1: Confirm generated products are not stale**

Run:

```powershell
corepack pnpm --filter @maxxuxx/tokens generated:check
corepack pnpm --filter @maxxuxx/docs manifest:release-check
```

Expected: both exit 0; four component manifest entries have Figma URLs.

- [ ] **Step 2: Run the complete command from a clean process**

Run: `corepack pnpm verify`

Expected: exit 0 with no failed TypeScript, Astro, token, component, content, guardrail, artifact, accessibility, link, route, responsive, or screenshot checks.

- [ ] **Step 3: Inspect the working tree**

```powershell
git status --short
git diff --check
git log --oneline -10
```

Expected: no uncommitted product changes, no whitespace errors, and bounded conventional commits matching the plan tasks.

- [ ] **Step 4: Verify the required Public repository state**

Run:

```powershell
gh repo view maxxuxx/design-system --json visibility,isPrivate
```

Expected for final integration and any parent-owned push:

```json
{"isPrivate":false,"visibility":"PUBLIC"}
```

This Public readback is required and valid; it does not block push or v0.1 completion. If either field differs, report `Repository visibility mismatch: expected PUBLIC.` before marking v0.1 complete or handing off any push. Do not change visibility from this plan, and do not treat a local Git remote as visibility evidence.

- [ ] **Step 5: Update spec status only after fresh evidence and the Public readback**

Change `상태: 사용자 검토 요청` to `상태: v0.1 구현 및 검증 완료`. Regenerate the component manifest once more and stage the generated public `components.json` in the final evidence commit even when its bytes are unchanged from the verified build:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
git add docs/superpowers/specs/2026-07-10-ai-readable-design-system-v0.1-design.md apps/docs/public/design-system/components.json
git commit -m "docs: mark design system v0.1 verified"
```
