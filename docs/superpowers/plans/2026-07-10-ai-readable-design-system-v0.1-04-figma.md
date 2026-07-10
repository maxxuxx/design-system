# AI-Readable Design System v0.1 Figma Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Before every Figma write, load `figma:figma-generate-library` and `figma:figma-use`; before a new file call, also load `figma:figma-create-new-file`. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 승인된 코드 토큰과 파일럿 계약을 비공개 Figma Design 파일의 Variables, Styles, Foundations 문서, Icon·Badge·Button·TextField 컴포넌트로 정확히 옮기고 구조·시각 QA 증거를 남긴다.

**Architecture:** Figma는 코드와 같은 이름·의미를 사용하는 별도 구현체다. `packages/tokens/dist/tokens.json`을 결정적 projection으로 변환해 단일 모드 Variables와 Styles를 만들고, repository-local ignored ledger 및 `dsb` shared plugin data로 모든 생성물을 재개 가능하게 추적한다. 컴포넌트는 하나씩 만들고 각 단계마다 `get_metadata`와 screenshot을 통과한 뒤 다음 컴포넌트로 이동한다.

**Tech Stack:** Figma Design, Figma Plugin API through `use_figma`, Figma Variables, Text Styles, Effect Styles, component sets, local JSON ledger.

## Global Constraints

- This plan consumes the completed artifacts from plan 01 and the frozen per-component contracts from plan 03.
- The Figma file must be private/team-restricted. Never store an access token; a Figma URL and node IDs are metadata, not credentials.
- Target editor must be Figma Design (`/design/`), never FigJam or Slides.
- Phase 0 performs no `use_figma` mutation. If no target file exists, create it only through a separate preflight approval gate before Phase 0 begins.
- Every phase posts `Phase N Checklist` with stable IDs, a subsection update, and a `Phase N Summary`.
- Every `use_figma` call includes `skillNames: "figma-use,figma-generate-library"` and returns all created/mutated node IDs.
- Never call `figma.notify`, `figma.closePlugin`, `getPluginData`, or `setPluginData`. Use top-level `await`, `return`, and shared plugin data.
- Mutating `use_figma` calls run sequentially. A script switches page at most once. No script performs more than 10 logical creations/mutations.
- Failed `use_figma` calls are not retried immediately. Read the error, inspect state if needed, correct the script, then retry.
- New top-level scene nodes are positioned away from existing content. Related children use auto-layout.
- Load every exact font style before text mutation. `listAvailableFontsAsync` must resolve `IBM Plex Sans KR` with the exact styles Regular, Medium, SemiBold, and Bold. No alternate family is permitted: if `IBM Plex Sans KR` is unavailable, stop before Phase 1 and repeat the Phase 0 source-of-truth decision.
- Color values use RGBA 0–1 for variables and RGB 0–1 plus paint-level opacity for paints.
- Every variable gets explicit scopes and WEB syntax. Primitive colors use `[]`; no variable keeps `ALL_SCOPES`.
- Every scene node created by this workflow receives `dsb/run_id`, `dsb/phase`, and a stable `dsb/key` immediately.
- Code Connect is explicitly skipped in v0.1.

## Runtime Inputs and State

Use run ID `design-system-v0.1-2026-07-10`.

Ledger path:

```text
figma/.state/design-system-v0.1.json
```

Plan 01 already ignores `figma/.state/`. Initialize this repository-relative file with `apply_patch`; never use an operating-system temporary directory, an absolute patch target, shell redirection, or a path outside the worktree. Read it before every Figma call and update it after every successful call.

Ledger schema:

```json
{
  "runId": "design-system-v0.1-2026-07-10",
  "fileKey": null,
  "fileUrl": null,
  "phase": "phase0",
  "step": "discovery",
  "font": { "family": null, "styles": {} },
  "entities": {
    "collections": {},
    "variables": {},
    "styles": {},
    "pages": {},
    "components": {}
  },
  "pendingValidations": [],
  "completedSteps": []
}
```

`figma/token-map.json` is the committed readback projection of `collections`, `variables`, and `styles`. `figma/.state/design-system-v0.1.json` remains the ignored turn-to-turn source of truth while writing.

## Component Matrices

| Component | Variants | Component properties | Required page |
|---|---:|---|---|
| Icon | 5 icon components, each 24px master; documented 16/20/24 instances | none; icon selection is component swap by consumers | `04.1 Icon` |
| Badge | 16: Size Small/Medium × Variant Soft/Solid × Tone Neutral/Primary/Success/Danger | `Label` TEXT | `04.2 Badge` |
| Button | 27: Size Small/Medium/Large × Variant Fill/Weak/Outline × State Default/Pressed/Disabled | `Label` TEXT, `Loading`, `Show leading icon`, `Show trailing icon` BOOLEAN, two icon INSTANCE_SWAP properties | `04.3 Button` |
| TextField | 8: Size Medium/Large × State Default/Focus/Error/Disabled | `Label`, `Value`, `Description`, `Error` TEXT | `04.4 TextField` |

## Executable Runtime Projection and Script Library

Every script in this section is a complete `use_figma` body. The executor serializes the current batch into the `input` literal before the call; the literal is generated only from `packages/tokens/dist/tokens.json`, the matrices above, and IDs read from `figma/.state/design-system-v0.1.json`. Never leave symbolic IDs in a submitted call.

### ResolvedToken to Figma operation projection

Run this pure function locally over the 106-token JSON before Phase 1. It returns 104 variable operations and two effect-style operations. `fontFamily` is the exact `IBM Plex Sans KR` family approved in Phase 0.

```js
function scopesFor(token) {
  if (token.kind === 'primitive' && token.type === 'color') return [];
  if (token.name.startsWith('color/text/') || token.name.includes('/on-')) return ['TEXT_FILL'];
  if (token.name.startsWith('color/icon/')) return ['SHAPE_FILL', 'STROKE_COLOR'];
  if (token.name.startsWith('color/border/') || token.name.startsWith('color/focus/')) return ['STROKE_COLOR'];
  if (token.kind === 'semantic' && token.type === 'color') return ['FRAME_FILL', 'SHAPE_FILL'];
  if (token.name.startsWith('space/')) return ['GAP'];
  if (token.name.startsWith('size/')) return ['WIDTH_HEIGHT'];
  if (token.name.startsWith('radius/')) return ['CORNER_RADIUS'];
  if (token.name.startsWith('font/size/')) return ['FONT_SIZE'];
  if (token.name.startsWith('font/line-height/')) return ['LINE_HEIGHT'];
  if (token.name.startsWith('font/weight/')) return ['FONT_WEIGHT'];
  if (token.name.startsWith('font/family/')) return ['FONT_FAMILY'];
  throw new Error(`No explicit Figma scope mapping: ${token.name}`);
}

function collectionFor(token) {
  if (token.type === 'color') return token.kind === 'primitive' ? 'Primitives' : 'Semantic Color';
  if (token.name.startsWith('space/') || token.name.startsWith('size/')) return 'Spacing';
  if (token.name.startsWith('font/')) return 'Typography';
  if (token.name.startsWith('radius/')) return 'Radius';
  if (token.type === 'shadow') return null;
  throw new Error(`No Figma collection mapping: ${token.name}`);
}

function rgba(hex) {
  if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) throw new Error(`Invalid color: ${hex}`);
  const value = hex.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
    a: value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1,
  };
}

function projectResolvedToken(token, fontFamily) {
  if (token.type === 'shadow') {
    return { kind: 'effectStyle', sourceName: token.name, cssVariable: token.cssVariable, sourceValue: token.resolvedValue };
  }
  const alias = typeof token.value === 'string' ? /^\{([^{}]+)\}$/.exec(token.value)?.[1] : undefined;
  const type = token.type === 'color' ? 'COLOR' : token.type === 'fontFamily' ? 'STRING' : 'FLOAT';
  let value = token.resolvedValue;
  if (token.type === 'color') value = rgba(String(token.resolvedValue));
  if (token.type === 'fontFamily') {
    if (fontFamily !== 'IBM Plex Sans KR') throw new Error(`Unapproved Figma font family: ${fontFamily}`);
    if (!String(token.resolvedValue).includes(fontFamily)) throw new Error('Approved Figma font is absent from the code token stack');
  }
  return {
    kind: 'variable',
    sourceName: token.name,
    name: token.name,
    collection: collectionFor(token),
    type,
    scopes: scopesFor(token),
    webSyntax: `var(${token.cssVariable})`,
    value,
    aliasTargetName: alias ?? null,
    sourceValue: token.value,
    resolvedValue: token.resolvedValue,
  };
}
```

The `font/family/sans` STRING variable preserves `token.resolvedValue` byte-for-byte, including the complete CSS fallback stack. Figma Text Styles separately apply the approved installed `IBM Plex Sans KR` family because text nodes select one family rather than a CSS stack. The full-stack STRING variable is documented in Foundations but is not bound to a text node; this is not a token-value override.

Assert before any Figma mutation:

```js
const projected = tokens.map((token) => projectResolvedToken(token, fontFamily));
if (projected.filter((item) => item.kind === 'variable').length !== 104) throw new Error('Expected 104 variable operations');
if (projected.filter((item) => item.kind === 'effectStyle').length !== 2) throw new Error('Expected 2 effect styles');
if (projected.filter((item) => item.type === 'COLOR').length !== 57) throw new Error('Expected 57 COLOR variables');
if (projected.filter((item) => item.collection === 'Semantic Color').length !== 26) throw new Error('Expected 26 Semantic Color variables');
if (new Set(projected.map((item) => item.sourceName)).size !== 106) throw new Error('Projection lost or duplicated tokens');
const fontToken = tokens.find((token) => token.name === 'font/family/sans');
const fontOperation = projected.find((item) => item.sourceName === 'font/family/sans');
if (!fontToken || fontOperation?.value !== fontToken.resolvedValue) throw new Error('Figma font-family STRING must preserve the complete code token stack');
```

### Variable batch script

Submit at most 10 operations per call. Primitive/raw operations must run before semantic alias operations.

```js
const input = {
  collectionName: 'Primitives',
  operations: [],
};
if (input.operations.length < 1 || input.operations.length > 10) throw new Error('Variable batch must contain 1..10 operations');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const collection = collections.find((item) => item.name === input.collectionName);
if (!collection) throw new Error(`Collection not found: ${input.collectionName}`);
const mode = collection.modes.find((item) => item.name === 'Default');
if (!mode) throw new Error(`Default mode not found: ${input.collectionName}`);
const modeId = mode.modeId;
const allVariables = await figma.variables.getLocalVariablesAsync();
const byName = new Map(allVariables.map((variable) => [variable.name, variable]));
const changed = [];
for (const operation of input.operations) {
  if (operation.collection !== input.collectionName) throw new Error(`Wrong collection for ${operation.sourceName}`);
  let variable = allVariables.find((item) => item.variableCollectionId === collection.id && item.name === operation.name);
  if (!variable) variable = figma.variables.createVariable(operation.name, collection, operation.type);
  if (variable.resolvedType !== operation.type) throw new Error(`Type mismatch: ${operation.name}`);
  let value = operation.value;
  if (operation.aliasTargetName) {
    const target = byName.get(operation.aliasTargetName);
    if (!target) throw new Error(`Alias target missing: ${operation.aliasTargetName}`);
    value = figma.variables.createVariableAlias(target);
  }
  variable.setValueForMode(modeId, value);
  variable.scopes = operation.scopes;
  variable.setVariableCodeSyntax('WEB', operation.webSyntax);
  variable.setSharedPluginData('dsb', 'run_id', RUN_ID);
  variable.setSharedPluginData('dsb', 'phase', 'phase1');
  variable.setSharedPluginData('dsb', 'key', `variable/${operation.sourceName}`);
  byName.set(operation.sourceName, variable);
  changed.push({
    sourceName: operation.sourceName,
    collection: collection.name,
    variableId: variable.id,
    modeId,
    name: variable.name,
    type: variable.resolvedType,
    scopes: variable.scopes,
    webSyntax: variable.codeSyntax.WEB,
    aliasTargetName: operation.aliasTargetName,
  });
}
return { createdNodeIds: [], changedVariables: changed };
```

The empty `operations` array above is replaced before submission with one actual projected batch. It is deliberately rejected if submitted unchanged.

### Text and effect style batch script

Use at most four definitions per call. Text definitions are exactly `Display 40/48 Bold`, `Heading 32/40 Bold`, `Title 24/32 SemiBold`, `Body/Large 18/28 Regular`, `Body 16/24 Regular`, `Body/Small 14/20 Regular`, `Caption 12/16 Regular`, and `Label 14/20 Medium`. Effect definitions are `Shadow/1` and `Shadow/2`, using the exact source colors `rgba(15,23,42,.06)` and `rgba(15,23,42,.10)`.

```js
const input = { kind: 'text', definitions: [], fontFamily: 'IBM Plex Sans KR', fontStyles: {} };
if (input.definitions.length < 1 || input.definitions.length > 4) throw new Error('Style batch must contain 1..4 definitions');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const changed = [];
if (input.kind === 'text') {
  await Promise.all(input.definitions.map((definition) => figma.loadFontAsync({ family: input.fontFamily, style: input.fontStyles[definition.weight] })));
  const existing = await figma.getLocalTextStylesAsync();
  for (const definition of input.definitions) {
    let style = existing.find((item) => item.name === definition.name);
    if (!style) style = figma.createTextStyle();
    style.name = definition.name;
    style.fontName = { family: input.fontFamily, style: input.fontStyles[definition.weight] };
    style.fontSize = definition.size;
    style.lineHeight = { unit: 'PIXELS', value: definition.lineHeight };
    style.letterSpacing = { unit: 'PIXELS', value: 0 };
    style.setSharedPluginData('dsb', 'run_id', RUN_ID);
    style.setSharedPluginData('dsb', 'key', `text-style/${definition.name}`);
    changed.push({ name: style.name, id: style.id, type: 'TEXT' });
  }
} else if (input.kind === 'effect') {
  const existing = await figma.getLocalEffectStylesAsync();
  for (const definition of input.definitions) {
    let style = existing.find((item) => item.name === definition.name);
    if (!style) style = figma.createEffectStyle();
    style.name = definition.name;
    style.effects = definition.effects;
    style.setSharedPluginData('dsb', 'run_id', RUN_ID);
    style.setSharedPluginData('dsb', 'key', `effect-style/${definition.name}`);
    changed.push({ name: style.name, id: style.id, type: 'EFFECT' });
  }
} else {
  throw new Error(`Unknown style kind: ${input.kind}`);
}
return { createdNodeIds: [], changedStyles: changed };
```

Exact effect input:

```js
[
  { name: 'Shadow/1', effects: [{ type: 'DROP_SHADOW', color: { r: 15/255, g: 23/255, b: 42/255, a: .06 }, offset: { x: 0, y: 1 }, radius: 2, spread: 0, visible: true, blendMode: 'NORMAL' }] },
  { name: 'Shadow/2', effects: [{ type: 'DROP_SHADOW', color: { r: 15/255, g: 23/255, b: 42/255, a: .10 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' }] },
]
```

### Page batch and documentation-root scripts

Create at most five pages per call:

```js
const input = { pageNames: [] };
if (input.pageNames.length < 1 || input.pageNames.length > 5) throw new Error('Page batch must contain 1..5 names');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const changed = [];
for (const name of input.pageNames) {
  let page = figma.root.children.find((item) => item.name === name);
  if (!page) page = figma.createPage();
  page.name = name;
  page.setSharedPluginData('dsb', 'run_id', RUN_ID);
  page.setSharedPluginData('dsb', 'phase', 'phase2');
  page.setSharedPluginData('dsb', 'key', `page/${name.toLowerCase().replaceAll(' ', '-')}`);
  changed.push({ name, id: page.id });
}
return { createdNodeIds: changed.map((item) => item.id), pages: changed };
```

After creation, reorder at most 10 pages per call with this complete script. The first call uses `startIndex: 0` and the first 10 ordered names; the second uses `startIndex: 10` and `['99 Deprecated']`.

```js
const input = { startIndex: 0, pageNames: [] };
if (!Number.isInteger(input.startIndex) || input.startIndex < 0) throw new Error('Invalid page startIndex');
if (input.pageNames.length < 1 || input.pageNames.length > 10) throw new Error('Page reorder batch must contain 1..10 names');
const changed = [];
for (const [offset, name] of input.pageNames.entries()) {
  const page = figma.root.children.find((item) => item.name === name);
  if (!page) throw new Error(`Page not found: ${name}`);
  figma.root.insertChild(input.startIndex + offset, page);
  changed.push({ name, id: page.id, index: input.startIndex + offset });
}
return { createdNodeIds: changed.map((item) => item.id), pages: changed };
```

Build one page root per call with this complete script. `input` contains the actual page name, copy, `IBM Plex Sans KR` family/style names, and variable IDs read from the ledger.

```js
const input = { pageName: '', title: '', description: '', fontFamily: '', regularStyle: '', boldStyle: '', canvasVariableId: '', textVariableId: '', secondaryTextVariableId: '', sectionGapVariableId: '', pagePaddingVariableId: '', titleTextStyleId: '', bodyTextStyleId: '' };
if (!input.pageName || !input.title || !input.fontFamily) throw new Error('Documentation root input is incomplete');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const page = figma.root.children.find((item) => item.name === input.pageName);
if (!page) throw new Error(`Page not found: ${input.pageName}`);
await figma.setCurrentPageAsync(page);
const existing = page.findAllWithCriteria({ sharedPluginData: { namespace: 'dsb', keys: ['key'] } }).find((node) => node.getSharedPluginData('dsb', 'key') === `doc-root/${input.pageName}`);
if (existing) {
  if (existing.type !== 'FRAME') throw new Error(`Documentation root is not a frame: ${input.pageName}`);
  existing.primaryAxisSizingMode = 'AUTO';
  return { createdNodeIds: [existing.id], rootId: existing.id };
}
await Promise.all([
  figma.loadFontAsync({ family: input.fontFamily, style: input.regularStyle }),
  figma.loadFontAsync({ family: input.fontFamily, style: input.boldStyle }),
]);
const [canvasVariable, textVariable, secondaryTextVariable, sectionGapVariable, pagePaddingVariable] = await Promise.all([
  figma.variables.getVariableByIdAsync(input.canvasVariableId),
  figma.variables.getVariableByIdAsync(input.textVariableId),
  figma.variables.getVariableByIdAsync(input.secondaryTextVariableId),
  figma.variables.getVariableByIdAsync(input.sectionGapVariableId),
  figma.variables.getVariableByIdAsync(input.pagePaddingVariableId),
]);
if (!canvasVariable || !textVariable || !secondaryTextVariable || !sectionGapVariable || !pagePaddingVariable) throw new Error('Documentation variables are missing');
const root = figma.createFrame();
root.layoutMode = 'VERTICAL';
root.name = `${input.pageName} / Documentation`;
root.resize(1440, 1);
root.layoutSizingHorizontal = 'FIXED';
root.primaryAxisSizingMode = 'AUTO';
root.setBoundVariable('itemSpacing', sectionGapVariable);
root.setBoundVariable('paddingTop', pagePaddingVariable); root.setBoundVariable('paddingRight', pagePaddingVariable); root.setBoundVariable('paddingBottom', pagePaddingVariable); root.setBoundVariable('paddingLeft', pagePaddingVariable);
root.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', canvasVariable)];
root.x = Math.max(0, ...page.children.filter((node) => node.id !== root.id).map((node) => node.x + node.width + 160));
root.y = 0;
root.setSharedPluginData('dsb', 'run_id', RUN_ID);
root.setSharedPluginData('dsb', 'phase', 'phase2');
root.setSharedPluginData('dsb', 'key', `doc-root/${input.pageName}`);
const title = figma.createText();
title.fontName = { family: input.fontFamily, style: input.boldStyle };
title.characters = input.title;
await title.setTextStyleIdAsync(input.titleTextStyleId);
title.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', textVariable)];
root.appendChild(title);
const description = figma.createText();
description.fontName = { family: input.fontFamily, style: input.regularStyle };
description.characters = input.description;
await description.setTextStyleIdAsync(input.bodyTextStyleId);
description.resize(1120, 1);
description.textAutoResize = 'HEIGHT';
description.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', secondaryTextVariable)];
root.appendChild(description);
page.appendChild(root);
return { createdNodeIds: [root.id, title.id, description.id], rootId: root.id };
```

Foundations cards are added in batches of at most two with this script. `kind` is `color`, `dimension`, `radius`, `textVariable`, `textStyle`, or `effectStyle`; every item supplies the actual readback ID. A `textVariable` supplies `fontFamily`, `fontSize`, `fontWeight`, or `lineHeight` plus its exact `resolvedValue`. Size, weight, and line-height variables bind to the sample; the full CSS font-family stack is shown verbatim because it is not a valid single-family text-node binding.

```js
const input = { pageName: '03 Foundations', rootId: '', sectionName: '', fontFamily: '', regularStyle: '', surfaceVariableId: '', textVariableId: '', sectionGapVariableId: '', cardGapVariableId: '', cardPaddingVariableId: '', items: [] };
if (input.items.length < 1 || input.items.length > 2) throw new Error('Foundation batch must contain 1..2 items');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const page = figma.root.children.find((item) => item.name === input.pageName);
const root = await figma.getNodeByIdAsync(input.rootId);
if (!page || !root || root.type !== 'FRAME') throw new Error('Foundation page/root missing');
await figma.setCurrentPageAsync(page);
await figma.loadFontAsync({ family: input.fontFamily, style: input.regularStyle });
const [surfaceVariable, textVariable, sectionGapVariable, cardGapVariable, cardPaddingVariable] = await Promise.all([
  figma.variables.getVariableByIdAsync(input.surfaceVariableId),
  figma.variables.getVariableByIdAsync(input.textVariableId),
  figma.variables.getVariableByIdAsync(input.sectionGapVariableId),
  figma.variables.getVariableByIdAsync(input.cardGapVariableId),
  figma.variables.getVariableByIdAsync(input.cardPaddingVariableId),
]);
if (!surfaceVariable || !textVariable || !sectionGapVariable || !cardGapVariable || !cardPaddingVariable) throw new Error('Foundation chrome variables are missing');
let section = root.findOne((node) => node.getSharedPluginData('dsb', 'key') === `foundation/${input.sectionName}`);
const created = [];
if (!section) {
  section = figma.createFrame();
  section.layoutMode = 'HORIZONTAL';
  section.name = input.sectionName;
  section.layoutWrap = 'WRAP';
  section.counterAxisSizingMode = 'AUTO';
  section.setBoundVariable('itemSpacing', sectionGapVariable);
  section.setSharedPluginData('dsb', 'run_id', RUN_ID);
  section.setSharedPluginData('dsb', 'phase', 'phase2');
  section.setSharedPluginData('dsb', 'key', `foundation/${input.sectionName}`);
  root.appendChild(section);
  section.layoutSizingHorizontal = 'FILL';
  created.push(section.id);
}
for (const item of input.items) {
  if (section.findOne((node) => node.getSharedPluginData('dsb', 'key') === `foundation-item/${item.sourceName}`)) continue;
  const card = figma.createFrame();
  card.layoutMode = 'VERTICAL';
  card.counterAxisSizingMode = 'AUTO';
  card.name = item.sourceName;
  card.setBoundVariable('itemSpacing', cardGapVariable);
  card.setBoundVariable('paddingTop', cardPaddingVariable); card.setBoundVariable('paddingRight', cardPaddingVariable); card.setBoundVariable('paddingBottom', cardPaddingVariable); card.setBoundVariable('paddingLeft', cardPaddingVariable);
  card.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', surfaceVariable)];
  card.setSharedPluginData('dsb', 'run_id', RUN_ID);
  card.setSharedPluginData('dsb', 'phase', 'phase2');
  card.setSharedPluginData('dsb', 'key', `foundation-item/${item.sourceName}`);
  section.appendChild(card);
  let sample;
  if (item.kind === 'textStyle') {
    sample = figma.createText();
    sample.fontName = { family: input.fontFamily, style: input.regularStyle };
    sample.characters = '가나다 ABC 123';
    await sample.setTextStyleIdAsync(item.id);
    sample.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', textVariable)];
  } else if (item.kind === 'textVariable') {
    if (!['fontFamily', 'fontSize', 'fontWeight', 'lineHeight'].includes(item.field)) throw new Error(`Invalid text variable field: ${item.field}`);
    const variable = await figma.variables.getVariableByIdAsync(item.id);
    if (!variable) throw new Error(`Text variable missing: ${item.sourceName}`);
    sample = figma.createText();
    sample.fontName = { family: input.fontFamily, style: input.regularStyle };
    sample.characters = item.field === 'fontFamily'
      ? `${item.sourceName}\n${item.resolvedValue}`
      : `${item.sourceName} · 가나다 ABC 123`;
    if (item.field !== 'fontFamily') sample.setBoundVariable(item.field, variable);
    sample.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', textVariable)];
  } else {
    sample = figma.createRectangle();
    sample.resize(item.kind === 'dimension' ? Math.max(2, item.resolvedValue) : 72, 72);
    sample.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', surfaceVariable)];
    if (item.kind === 'color') {
      const variable = await figma.variables.getVariableByIdAsync(item.id);
      sample.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: .5, g: .5, b: .5 } }, 'color', variable)];
    } else if (item.kind === 'dimension') {
      const variable = await figma.variables.getVariableByIdAsync(item.id);
      sample.setBoundVariable('width', variable);
    } else if (item.kind === 'radius') {
      const variable = await figma.variables.getVariableByIdAsync(item.id);
      sample.setBoundVariable('cornerRadius', variable);
    } else if (item.kind === 'effectStyle') {
      await sample.setEffectStyleIdAsync(item.id);
    } else throw new Error(`Unknown foundation item kind: ${item.kind}`);
  }
  card.appendChild(sample);
  const label = figma.createText();
  label.fontName = { family: input.fontFamily, style: input.regularStyle };
  label.characters = `${item.sourceName}\n${item.webSyntax ?? ''}`.trim();
  label.fontSize = 12;
  label.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', textVariable)];
  label.resize(180, 1);
  label.textAutoResize = 'HEIGHT';
  card.appendChild(label);
  created.push(card.id, sample.id, label.id);
}
return { createdNodeIds: created, sectionId: section.id };
```

### Icon master and catalog scripts

Create all five masters in one call from the exact `ICON_SVGS` strings committed by plan 03:

```js
const input = { pageName: '04.1 Icon', icons: [], colorVariableName: 'color/icon/primary', sizeVariableName: 'size/icon/large' };
if (input.icons.length !== 5) throw new Error('Icon master batch must contain exactly five SVGs');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const page = figma.root.children.find((item) => item.name === input.pageName);
if (!page) throw new Error(`Page not found: ${input.pageName}`);
await figma.setCurrentPageAsync(page);
const variables = await figma.variables.getLocalVariablesAsync();
const colorVariable = variables.find((item) => item.name === input.colorVariableName);
const sizeVariable = variables.find((item) => item.name === input.sizeVariableName);
if (!colorVariable || !sizeVariable) throw new Error('Icon color/size variable not found');
const changed = [];
for (const definition of input.icons) {
  const key = `component/icon/${definition.name}`;
  let component = page.findAllWithCriteria({ sharedPluginData: { namespace: 'dsb', keys: ['key'] } }).find((node) => node.getSharedPluginData('dsb', 'key') === key);
  if (!component) {
    const imported = figma.createNodeFromSvg(definition.svg);
    component = figma.createComponent();
    component.name = `Icon/${definition.name}`;
    component.resize(24, 24);
    component.setBoundVariable('width', sizeVariable);
    component.setBoundVariable('height', sizeVariable);
    component.clipsContent = true;
    for (const child of [...imported.children]) component.appendChild(child);
    imported.remove();
  }
  for (const vector of component.findAllWithCriteria({ types: ['VECTOR'] })) {
    if (Array.isArray(vector.strokes) && vector.strokes.length > 0) {
      vector.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', colorVariable)];
    }
    if (Array.isArray(vector.fills) && vector.fills.length > 0) {
      vector.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', colorVariable)];
    }
  }
  component.setSharedPluginData('dsb', 'run_id', RUN_ID);
  component.setSharedPluginData('dsb', 'phase', 'phase3');
  component.setSharedPluginData('dsb', 'key', key);
  changed.push({ name: definition.name, id: component.id, key: component.key });
}
return { createdNodeIds: changed.map((item) => item.id), icons: changed };
```

Create/find `Icon Catalog`, then append at most 10 size/name instances per call:

```js
const input = {
  pageName: '04.1 Icon',
  instances: [],
  iconComponentIds: {},
  sizeVariableNames: { 16: 'size/icon/small', 20: 'size/icon/medium', 24: 'size/icon/large' },
};
if (input.instances.length < 1 || input.instances.length > 10) throw new Error('Icon catalog batch must contain 1..10 instances');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const page = figma.root.children.find((item) => item.name === input.pageName);
if (!page) throw new Error('Icon page missing');
await figma.setCurrentPageAsync(page);
const variables = await figma.variables.getLocalVariablesAsync();
let catalog = page.findAllWithCriteria({ sharedPluginData: { namespace: 'dsb', keys: ['key'] } }).find((node) => node.getSharedPluginData('dsb', 'key') === 'doc/icon-catalog');
const changed = [];
if (!catalog) {
  catalog = figma.createFrame();
  catalog.layoutMode = 'HORIZONTAL';
  catalog.name = 'Icon Catalog';
  catalog.layoutWrap = 'WRAP';
  catalog.itemSpacing = 24;
  catalog.paddingTop = 40; catalog.paddingRight = 40; catalog.paddingBottom = 40; catalog.paddingLeft = 40;
  catalog.setSharedPluginData('dsb', 'run_id', RUN_ID);
  catalog.setSharedPluginData('dsb', 'phase', 'phase3');
  catalog.setSharedPluginData('dsb', 'key', 'doc/icon-catalog');
  page.appendChild(catalog);
  changed.push(catalog.id);
}
for (const definition of input.instances) {
  const key = `doc/icon-instance/${definition.name}/${definition.size}`;
  if (catalog.findOne((node) => node.getSharedPluginData('dsb', 'key') === key)) continue;
  const master = await figma.getNodeByIdAsync(input.iconComponentIds[definition.name]);
  if (!master || master.type !== 'COMPONENT') throw new Error(`Icon master missing: ${definition.name}`);
  const instance = master.createInstance();
  instance.name = `${definition.name}/${definition.size}`;
  instance.resize(definition.size, definition.size);
  const sizeVariable = variables.find((item) => item.name === input.sizeVariableNames[definition.size]);
  if (!sizeVariable) throw new Error(`Icon size variable missing: ${definition.size}`);
  instance.setBoundVariable('width', sizeVariable);
  instance.setBoundVariable('height', sizeVariable);
  instance.setSharedPluginData('dsb', 'run_id', RUN_ID);
  instance.setSharedPluginData('dsb', 'phase', 'phase3');
  instance.setSharedPluginData('dsb', 'key', key);
  catalog.appendChild(instance);
  changed.push(instance.id);
}
return { createdNodeIds: changed, catalogId: catalog.id };
```

### Badge, Button, and TextField variant-batch script

Each call resolves at most nine requested variants, reusing an existing component with the same `dsb/key` or creating it when absent. Its ordered `variantIds` result always covers the complete input batch, including reused IDs, so a partial-failure resume can safely feed the combine step. `input.variants` contains the exact axis objects listed in Tasks 5–7; `defaultIconId` is the actual `Icon/ChevronRight` ID, and `textStyleIds` contains the actual `Body/Large`, `Body`, `Body/Small`, and `Caption` IDs from the ledger. All variable lookups use the exact plan 01 source names, so no derived Figma-only token fields exist.

```js
const input = { kind: '', pageName: '', variants: [], fontFamily: '', regularStyle: '', semiboldStyle: '', defaultIconId: '', textStyleIds: { 'Body/Large': '', Body: '', 'Body/Small': '', Caption: '' } };
if (!['Badge', 'Button', 'TextField'].includes(input.kind)) throw new Error(`Unknown component kind: ${input.kind}`);
if (input.variants.length < 1 || input.variants.length > 9) throw new Error('Variant batch must contain 1..9 variants');
const RUN_ID = 'design-system-v0.1-2026-07-10';
const page = figma.root.children.find((item) => item.name === input.pageName);
if (!page) throw new Error(`Page not found: ${input.pageName}`);
await figma.setCurrentPageAsync(page);
await Promise.all([
  figma.loadFontAsync({ family: input.fontFamily, style: input.regularStyle }),
  figma.loadFontAsync({ family: input.fontFamily, style: input.semiboldStyle }),
]);
const allVariables = await figma.variables.getLocalVariablesAsync();
const variable = (name) => {
  const result = allVariables.find((item) => item.name === name);
  if (!result) throw new Error(`Variable not found: ${name}`);
  return result;
};
const textStyleId = (name) => {
  const id = input.textStyleIds[name];
  if (!id) throw new Error(`Text style ID missing: ${name}`);
  return id;
};
const bindSemibold = (node) => node.setBoundVariable('fontWeight', variable('font/weight/semibold'));
const colorPaint = (name) => figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', variable(name));
const bindRadius = (node, name = 'radius/md') => {
  const value = variable(name);
  node.setBoundVariable('topLeftRadius', value); node.setBoundVariable('topRightRadius', value);
  node.setBoundVariable('bottomLeftRadius', value); node.setBoundVariable('bottomRightRadius', value);
};
const bindHeight = (node, name) => {
  const value = variable(name);
  node.resize(Math.max(node.width, 80), Number(value.valuesByMode[Object.keys(value.valuesByMode)[0]]));
  node.setBoundVariable('height', value);
};
const created = [];
const reused = [];
const variantIds = [];
const keyedNodes = page.findAllWithCriteria({ sharedPluginData: { namespace: 'dsb', keys: ['key'] } });
for (const axes of input.variants) {
  const variantName = Object.entries(axes).map(([name, value]) => `${name}=${value}`).join(', ');
  const key = `component/${input.kind.toLowerCase()}/variant/${variantName}`;
  const matches = keyedNodes.filter((node) => node.getSharedPluginData('dsb', 'key') === key);
  if (matches.length > 1) throw new Error(`Duplicate variant key: ${key}`);
  if (matches.length === 1) {
    const existing = matches[0];
    if (existing.type !== 'COMPONENT') throw new Error(`Variant key is not a component: ${key}`);
    reused.push(existing.id);
    variantIds.push(existing.id);
    continue;
  }
  const component = figma.createComponent();
  component.name = variantName;
  component.layoutMode = 'VERTICAL';
  component.primaryAxisSizingMode = 'AUTO';
  component.counterAxisSizingMode = 'AUTO';
  component.setSharedPluginData('dsb', 'run_id', RUN_ID);
  component.setSharedPluginData('dsb', 'phase', 'phase3');
  component.setSharedPluginData('dsb', 'key', key);

  if (input.kind === 'Badge') {
    component.layoutMode = 'HORIZONTAL'; component.primaryAxisAlignItems = 'CENTER'; component.counterAxisAlignItems = 'CENTER';
    bindRadius(component, 'radius/full');
    bindHeight(component, axes.Size === 'Small' ? 'size/badge/small' : 'size/badge/medium');
    const padding = variable('space/8');
    component.setBoundVariable('paddingLeft', padding); component.setBoundVariable('paddingRight', padding);
    if (axes.Size === 'Medium') {
      const left = figma.createRectangle(); left.name = 'padding-adjustment-left'; left.resize(2, 1); left.opacity = 0; left.setBoundVariable('width', variable('space/2')); component.appendChild(left);
    }
    const tone = axes.Tone.toLowerCase(); const soft = axes.Variant === 'Soft';
    const bgName = tone === 'primary' ? (soft ? 'color/action/weak' : 'color/action/primary') : `color/status/${tone}${soft ? '-subtle' : ''}`;
    const textName = tone === 'primary' ? (soft ? 'color/action/on-weak' : 'color/action/on-primary') : (soft ? `color/status/${tone}` : 'color/status/on-status');
    component.fills = [colorPaint(bgName)];
    const label = figma.createText(); label.name = 'label'; label.fontName = { family: input.fontFamily, style: input.semiboldStyle }; label.characters = 'Badge'; await label.setTextStyleIdAsync(textStyleId(axes.Size === 'Small' ? 'Caption' : 'Body/Small')); bindSemibold(label); label.fills = [colorPaint(textName)]; component.appendChild(label);
    if (axes.Size === 'Medium') {
      const right = figma.createRectangle(); right.name = 'padding-adjustment-right'; right.resize(2, 1); right.opacity = 0; right.setBoundVariable('width', variable('space/2')); component.appendChild(right);
    }
  }

  if (input.kind === 'Button') {
    component.layoutMode = 'HORIZONTAL'; component.primaryAxisAlignItems = 'CENTER'; component.counterAxisAlignItems = 'CENTER';
    bindRadius(component);
    const sizeKey = axes.Size.toLowerCase();
    bindHeight(component, `size/control/${sizeKey}`);
    const paddingName = axes.Size === 'Small' ? 'space/16' : axes.Size === 'Medium' ? 'space/20' : 'space/24';
    const gapName = axes.Size === 'Large' ? 'space/12' : 'space/8';
    component.setBoundVariable('paddingLeft', variable(paddingName)); component.setBoundVariable('paddingRight', variable(paddingName)); component.setBoundVariable('itemSpacing', variable(gapName));
    const disabled = axes.State === 'Disabled'; const pressed = axes.State === 'Pressed';
    let bgName = 'color/action/primary'; let textName = 'color/action/on-primary'; let borderName = bgName;
    if (axes.Variant === 'Fill' && pressed) bgName = 'color/action/primary-pressed';
    if (axes.Variant === 'Weak') { bgName = 'color/action/weak'; textName = pressed ? 'color/action/primary-pressed' : 'color/action/on-weak'; borderName = bgName; }
    if (axes.Variant === 'Outline') { bgName = pressed ? 'color/action/weak' : 'color/bg/surface'; textName = pressed ? 'color/action/on-weak' : 'color/text/primary'; borderName = 'color/border/strong'; }
    if (disabled) { bgName = 'color/bg/subtle'; textName = 'color/text/disabled'; borderName = 'color/border/default'; }
    component.fills = [colorPaint(bgName)]; component.strokes = [colorPaint(borderName)]; component.strokeWeight = 1;
    const master = await figma.getNodeByIdAsync(input.defaultIconId); if (!master || master.type !== 'COMPONENT') throw new Error('Default icon missing');
    const leading = master.createInstance(); leading.name = 'leading-icon'; leading.resize(20, 20); leading.setBoundVariable('width', variable('size/icon/medium')); leading.setBoundVariable('height', variable('size/icon/medium')); component.appendChild(leading);
    const buttonTextStyle = axes.Size === 'Small' ? 'Body/Small' : axes.Size === 'Medium' ? 'Body' : 'Body/Large';
    const label = figma.createText(); label.name = 'label'; label.fontName = { family: input.fontFamily, style: input.semiboldStyle }; label.characters = 'Button'; await label.setTextStyleIdAsync(textStyleId(buttonTextStyle)); bindSemibold(label); label.fills = [colorPaint(textName)]; component.appendChild(label);
    const trailing = master.createInstance(); trailing.name = 'trailing-icon'; trailing.resize(20, 20); trailing.setBoundVariable('width', variable('size/icon/medium')); trailing.setBoundVariable('height', variable('size/icon/medium')); component.appendChild(trailing);
    const overlay = figma.createFrame(); overlay.name = 'loading-overlay'; component.appendChild(overlay); overlay.layoutPositioning = 'ABSOLUTE'; overlay.x = 0; overlay.y = 0; overlay.resize(component.width, component.height); overlay.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }; overlay.fills = [colorPaint('color/bg/subtle')]; overlay.strokes = [colorPaint('color/border/default')]; overlay.strokeWeight = 1; bindRadius(overlay); overlay.visible = false;
    const spinner = figma.createEllipse(); spinner.name = 'spinner'; spinner.resize(20, 20); spinner.setBoundVariable('width', variable('size/icon/medium')); spinner.setBoundVariable('height', variable('size/icon/medium')); spinner.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.6, innerRadius: .72 }; spinner.fills = [colorPaint('color/text/disabled')]; overlay.appendChild(spinner); spinner.x = (overlay.width - spinner.width) / 2; spinner.y = (overlay.height - spinner.height) / 2; spinner.constraints = { horizontal: 'CENTER', vertical: 'CENTER' };
  }

  if (input.kind === 'TextField') {
    component.setBoundVariable('itemSpacing', variable('space/8')); bindRadius(component);
    const label = figma.createText(); label.name = 'label'; label.fontName = { family: input.fontFamily, style: input.semiboldStyle }; label.characters = 'Label'; await label.setTextStyleIdAsync(textStyleId('Body/Small')); bindSemibold(label); label.fills = [colorPaint('color/text/primary')]; component.appendChild(label);
    const field = figma.createFrame(); field.layoutMode = 'HORIZONTAL'; field.name = 'field'; field.counterAxisAlignItems = 'CENTER'; field.setBoundVariable('paddingLeft', variable('space/16')); field.setBoundVariable('paddingRight', variable('space/16')); bindHeight(field, axes.Size === 'Medium' ? 'size/control/medium' : 'size/control/large'); field.resize(320, field.height); field.layoutSizingHorizontal = 'FIXED'; bindRadius(field);
    let bgName = 'color/bg/surface'; let borderName = axes.State === 'Focus' ? 'color/border/focus' : axes.State === 'Error' ? 'color/status/danger' : 'color/border/default'; let textName = 'color/text/primary';
    if (axes.State === 'Disabled') { bgName = 'color/bg/subtle'; borderName = 'color/border/default'; textName = 'color/text/disabled'; }
    field.fills = [colorPaint(bgName)]; field.strokes = [colorPaint(borderName)]; field.strokeWeight = 1; component.appendChild(field);
    const value = figma.createText(); value.name = 'value'; value.fontName = { family: input.fontFamily, style: input.regularStyle }; value.characters = 'Value'; await value.setTextStyleIdAsync(textStyleId('Body')); value.fills = [colorPaint(textName)]; field.appendChild(value);
    const description = figma.createText(); description.name = 'description'; description.fontName = { family: input.fontFamily, style: input.regularStyle }; description.characters = 'Description'; await description.setTextStyleIdAsync(textStyleId('Caption')); description.textAutoResize = 'HEIGHT'; description.resize(320, 1); description.fills = [colorPaint('color/text/secondary')]; description.visible = true; component.appendChild(description);
    const error = figma.createText(); error.name = 'error'; error.fontName = { family: input.fontFamily, style: input.regularStyle }; error.characters = 'Error'; await error.setTextStyleIdAsync(textStyleId('Caption')); error.textAutoResize = 'HEIGHT'; error.resize(320, 1); error.fills = [colorPaint('color/status/danger')]; error.visible = axes.State === 'Error'; component.appendChild(error);
  }
  page.appendChild(component);
  created.push(component.id);
  variantIds.push(component.id);
}
return { createdNodeIds: created, createdVariantIds: created, reusedVariantIds: reused, variantIds };
```

### Combine, grid, and component-property script

Run once per Badge, Button, or TextField after all variant batches. `variantIds` is the exact concatenated ledger result.

```js
const input = { kind: '', pageName: '', variantIds: [], defaultIconId: '' };
const expectedCounts = { Badge: 16, Button: 27, TextField: 8 };
if (input.variantIds.length !== expectedCounts[input.kind]) throw new Error(`Wrong variant count for ${input.kind}`);
const RUN_ID = 'design-system-v0.1-2026-07-10';
const page = figma.root.children.find((item) => item.name === input.pageName); if (!page) throw new Error('Component page missing');
await figma.setCurrentPageAsync(page);
const nodes = await Promise.all(input.variantIds.map((id) => figma.getNodeByIdAsync(id)));
if (nodes.some((node) => !node || node.type !== 'COMPONENT')) throw new Error('Every variant ID must resolve to a ComponentNode');
let componentSet = page.findAllWithCriteria({ types: ['COMPONENT_SET'] }).find((node) => node.getSharedPluginData('dsb', 'key') === `componentset/${input.kind.toLowerCase()}`);
if (!componentSet) componentSet = figma.combineAsVariants(nodes, page);
componentSet.name = input.kind; componentSet.x = 680; componentSet.y = 40;
const gap = 20; const padding = 40; const columns = input.kind === 'Badge' ? 4 : input.kind === 'Button' ? 3 : 4;
componentSet.children.forEach((child, index) => { child.x = padding + (index % columns) * (child.width + gap); child.y = padding + Math.floor(index / columns) * (child.height + gap); });
let maxX = 0; let maxY = 0; for (const child of componentSet.children) { maxX = Math.max(maxX, child.x + child.width); maxY = Math.max(maxY, child.y + child.height); }
componentSet.resizeWithoutConstraints(maxX + padding, maxY + padding);
componentSet.setSharedPluginData('dsb', 'run_id', RUN_ID); componentSet.setSharedPluginData('dsb', 'phase', 'phase3'); componentSet.setSharedPluginData('dsb', 'key', `componentset/${input.kind.toLowerCase()}`);
const properties = [];
const add = (name, type, defaultValue) => {
  const definitions = componentSet.componentPropertyDefinitions;
  const existingKey = Object.keys(definitions).find((key) => key.split('#')[0] === name);
  if (existingKey) {
    const definition = definitions[existingKey];
    if (definition.type !== type || definition.defaultValue !== defaultValue) throw new Error(`Component property drift: ${name}`);
    properties.push({ name, type, key: existingKey });
    return existingKey;
  }
  const key = componentSet.addComponentProperty(name, type, defaultValue);
  properties.push({ name, type, key });
  return key;
};
if (input.kind === 'Badge') {
  const labelKey = add('Label', 'TEXT', 'Badge');
  for (const child of componentSet.children) child.findOne((node) => node.name === 'label').componentPropertyReferences = { characters: labelKey };
}
if (input.kind === 'Button') {
  const labelKey = add('Label', 'TEXT', 'Button'); const loadingKey = add('Loading', 'BOOLEAN', false);
  const showLeadingKey = add('Show leading icon', 'BOOLEAN', false); const showTrailingKey = add('Show trailing icon', 'BOOLEAN', false);
  const leadingKey = add('Leading icon', 'INSTANCE_SWAP', input.defaultIconId); const trailingKey = add('Trailing icon', 'INSTANCE_SWAP', input.defaultIconId);
  for (const child of componentSet.children) {
    child.findOne((node) => node.name === 'label').componentPropertyReferences = { characters: labelKey };
    child.findOne((node) => node.name === 'loading-overlay').componentPropertyReferences = { visible: loadingKey };
    const leading = child.findOne((node) => node.name === 'leading-icon'); leading.visible = false; leading.componentPropertyReferences = { visible: showLeadingKey, mainComponent: leadingKey };
    const trailing = child.findOne((node) => node.name === 'trailing-icon'); trailing.visible = false; trailing.componentPropertyReferences = { visible: showTrailingKey, mainComponent: trailingKey };
  }
}
if (input.kind === 'TextField') {
  const refs = { label: add('Label', 'TEXT', 'Label'), value: add('Value', 'TEXT', 'Value'), description: add('Description', 'TEXT', 'Description'), error: add('Error', 'TEXT', 'Error') };
  for (const child of componentSet.children) for (const [name, key] of Object.entries(refs)) child.findOne((node) => node.name === name).componentPropertyReferences = { characters: key };
}
return { createdNodeIds: [componentSet.id], componentSetId: componentSet.id, componentCount: componentSet.children.length, variantCount: componentSet.children.length, properties: properties.map(({ name, type }) => ({ name, type })) };
```

## Per-Component Handoff Rule

After Foundations approval, execute plan 03 and this plan as an interleaved vertical slice. For each component, plan 03 first completes the React implementation, MDX, manifest, tests, build, and mobile/desktop browser review with only that new MDX `figmaUrl` initially empty. Then execute the matching Figma task below.

Immediately after the matching Figma validation succeeds, replace that MDX `figmaUrl` with the returned stable documentation target URL defined by the task (`Icon Catalog` for Icon; component-set URL for Badge, Button, and TextField), then run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
```

Do not defer a component URL until Task 8. Task 8 repeats the four-way reconciliation as a final audit.

After the three commands succeed, commit the current MDX and generated manifest together before returning to plan 03. Use the exact row below; no reconciliation commit may contain only one side of the source/generated pair.

| Component | Stage together | Commit message |
|---|---|---|
| Icon | `apps/docs/src/content/components/icon.mdx apps/docs/public/design-system/components.json` | `docs(figma): link icon design source` |
| Badge | `apps/docs/src/content/components/badge.mdx apps/docs/public/design-system/components.json` | `docs(figma): link badge design source` |
| Button | `apps/docs/src/content/components/button.mdx apps/docs/public/design-system/components.json` | `docs(figma): link button design source` |
| TextField | `apps/docs/src/content/components/text-field.mdx apps/docs/public/design-system/components.json` | `docs(figma): link text field design source` |

---

### Task 1: Establish the target file and complete read-only Phase 0

**Files:**
- Create locally, ignored: `figma/.state/design-system-v0.1.json`
- Create after discovery: `figma/README.md`

**Interfaces:**
- Consumes: repository token JSON and plan 03 contracts.
- Produces: `fileKey`, `fileUrl`, page/variable/style/component inventory, font inventory, library inventory, approved gap analysis.

- [ ] **Step 1: Resolve the target-file gate before Phase 0**

If the user supplied a private Figma Design URL, use it. Otherwise post a target-file checklist, ask explicit permission to create `Design System v0.1`, load `figma-create-new-file`, create a Design file, and record its URL/key. This is a separate approved setup mutation; Phase 0 begins only after the file exists.

- [ ] **Step 2: Initialize and read the local ledger**

Create `figma/.state/design-system-v0.1.json` with the exact schema above using `apply_patch`, inserting the returned URL/key. At the start of every subsequent execution turn, read this file before any Figma call. After a successful call, patch only the returned IDs, `phase`, `step`, pending validations, and completed steps; never reconstruct IDs from names when an ID has already been recorded.

- [ ] **Step 3: Post the Phase 0 checklist**

Use these stable IDs:

```text
P0.a Analyze code tokens and component contracts
P0.b Inspect target file pages, variables, styles, components, fonts
P0.c Enumerate available libraries and search reusable assets
P0.d Lock exact v0.1 token and component scope
P0.e Resolve every code/Figma conflict
P0.f Publish gap analysis and request approval
```

- [ ] **Step 4: Run the read-only inspection script**

Use this complete script:

```js
figma.skipInvisibleInstanceChildren = true;

const [collections, variables, textStyles, effectStyles, fonts] = await Promise.all([
  figma.variables.getLocalVariableCollectionsAsync(),
  figma.variables.getLocalVariablesAsync(),
  figma.getLocalTextStylesAsync(),
  figma.getLocalEffectStylesAsync(),
  figma.listAvailableFontsAsync(),
]);

const pages = figma.root.children.map((page) => ({
  id: page.id,
  name: page.name,
  childCount: page.children.length,
}));

return {
  editorType: figma.editorType,
  fileKey: figma.fileKey,
  pages,
  collections: collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    modes: collection.modes,
    variableCount: collection.variableIds.length,
  })),
  variables: variables.map((variable) => ({
    id: variable.id,
    name: variable.name,
    collectionId: variable.variableCollectionId,
    type: variable.resolvedType,
    scopes: variable.scopes,
    codeSyntax: variable.codeSyntax,
  })),
  textStyles: textStyles.map((style) => ({ id: style.id, name: style.name })),
  effectStyles: effectStyles.map((style) => ({ id: style.id, name: style.name })),
  eligibleFonts: fonts
    .filter(({ fontName }) => fontName.family === 'IBM Plex Sans KR')
    .map(({ fontName }) => fontName),
};
```

Expected: `editorType` is `figma`; new files have no local variables/components; exact Korean font styles are returned.

- [ ] **Step 5: Discover and paginate libraries before searching**

Call `get_libraries({ fileKey })` until `libraries_available_to_add_next_offset` is `null`. Then call `search_design_system` for `icon`, `badge`, `button`, `text field`, `color`, and `spacing`, including components/variables/styles. Record reuse decisions. Rebuild unless API, token model, naming, and ownership all match.

- [ ] **Step 6: Publish gap analysis and obtain Phase 0 approval**

Report code tokens present vs Figma tokens present, planned five collections, eight text styles, two effect styles, four component families, chosen font, and every conflict. State that component code is a frozen contract from plan 03, not yet a production implementation. Wait for explicit approval.

- [ ] **Step 7: Write discovery metadata**

`figma/README.md` records the private file URL, chosen font, page plan, collection plan, explicit Code Connect exclusion, and approval date. Do not claim Foundations or components exist yet.

### Task 2: Create and validate Figma Variables and Styles

**Files:**
- Modify locally, ignored: `figma/.state/design-system-v0.1.json`
- Create: `figma/token-map.json`
- Modify: `figma/README.md`

**Interfaces:**
- Consumes: `packages/tokens/dist/tokens.json` with `ResolvedToken[]`.
- Produces: collections `Primitives`, `Semantic Color`, `Spacing`, `Typography`, `Radius`; eight Text Styles; two Effect Styles.

- [ ] **Step 1: Post the Phase 1 checklist**

```text
P1.a Create/find five collections and rename default modes to Default
P1.b Create primitive variables in batches of at most 10
P1.c Create semantic aliases in batches of at most 10
P1.d Set explicit scopes
P1.e Set exact WEB syntax
P1.f Create text and effect styles
P1.g Publish variable summary
P1.h Publish style list and validate exit criteria
```

- [ ] **Step 2: Create collections idempotently**

Run once with this script:

```js
const RUN_ID = 'design-system-v0.1-2026-07-10';
const names = ['Primitives', 'Semantic Color', 'Spacing', 'Typography', 'Radius'];
const existing = await figma.variables.getLocalVariableCollectionsAsync();
const created = [];
const reused = [];
const results = [];

for (const name of names) {
  let collection = existing.find((item) => item.name === name);
  if (!collection) {
    collection = figma.variables.createVariableCollection(name);
    created.push(collection.id);
  } else {
    reused.push(collection.id);
  }
  if (collection.modes.length !== 1) throw new Error(`${name} must contain exactly one mode`);
  if (collection.modes[0].name !== 'Default') collection.renameMode(collection.modes[0].modeId, 'Default');
  collection.setSharedPluginData('dsb', 'run_id', RUN_ID);
  collection.setSharedPluginData('dsb', 'phase', 'phase1');
  collection.setSharedPluginData('dsb', 'key', `collection/${name.toLowerCase().replaceAll(' ', '-')}`);
  results.push({ id: collection.id, name, modeId: collection.modes[0].modeId });
}

return {
  createdNodeIds: [],
  createdCollectionIds: created,
  reusedCollectionIds: reused,
  collections: results,
};
```

Expected: five total collections; every mode is `Default`. Save IDs to the ledger.

- [ ] **Step 3: Project all 106 tokens before submitting a variable call**

Run `projectResolvedToken` from the executable library over the exact `tokens` array in `packages/tokens/dist/tokens.json`. Use the `IBM Plex Sans KR` family approved in Phase 0. The preflight must prove 104 variable operations, including 26 Semantic Color and 57 COLOR variables, two effect-style operations, and 106 unique `sourceName` values. It must also prove that the `font/family/sans` operation retains the full `resolvedValue`. Persist that projection in the ignored ledger so every submitted batch is reproducible.

- [ ] **Step 4: Create raw variables, then semantic aliases**

Partition the 104 projected variable operations by collection. Within each collection, submit all operations with `aliasTargetName === null` first, then all alias operations. Chunk each partition into arrays of at most 10 and run the exact Variable batch script above. The script discovers the real `Default` `modeId` from the collection, resolves alias targets by the exact source token name, sets explicit scopes and WEB syntax, and returns the readback fields required for the ledger. There are no hand-authored intermediate token fields and no guessed IDs.

Expected scope projection is exact and must also match plan 05: primitive colors `[]`; semantic `color/text/*` and any `/on-*` token `['TEXT_FILL']`; semantic border/focus `['STROKE_COLOR']`; other semantic color tokens `['FRAME_FILL','SHAPE_FILL']`; `space/*` `['GAP']`; `size/*` `['WIDTH_HEIGHT']`; font family/size/line-height/weight their matching single font scope; radius `['CORNER_RADIUS']`.

- [ ] **Step 5: Create eight Text Styles and two Effect Styles in bounded calls**

Run the exact style batch script above in these calls, using the chosen family and the exact discovered style names:

1. Text definitions:

   ```js
   [
     { name: 'Display', size: 40, lineHeight: 48, weight: 'Bold' },
     { name: 'Heading', size: 32, lineHeight: 40, weight: 'Bold' },
     { name: 'Title', size: 24, lineHeight: 32, weight: 'SemiBold' },
     { name: 'Body/Large', size: 18, lineHeight: 28, weight: 'Regular' },
   ]
   ```

2. Text definitions:

   ```js
   [
     { name: 'Body', size: 16, lineHeight: 24, weight: 'Regular' },
     { name: 'Body/Small', size: 14, lineHeight: 20, weight: 'Regular' },
     { name: 'Caption', size: 12, lineHeight: 16, weight: 'Regular' },
     { name: 'Label', size: 14, lineHeight: 20, weight: 'Medium' },
   ]
   ```

3. Effect: the exact `Shadow/1` and `Shadow/2` definitions shown above.

No call contains more than four style definitions. Save every returned style ID to the ledger.

- [ ] **Step 6: Validate Phase 1 and write the exact committed token-map**

Run a fresh read-only inventory and reject anything except five ordered collections, 104 variables (26 in Semantic Color and 57 with resolved type COLOR), one `Default` mode per collection, zero broken aliases, zero `ALL_SCOPES`, WEB syntax on every variable, eight ordered text styles, and two ordered effect styles. Compare every readback entry to the deterministic projection, not merely the counts.

Write `figma/token-map.json` with exactly this plan-05-compatible contract:

```text
schemaVersion: 1
collections[5]: { name, id, mode: { id, name: "Default" }, variableCount }
variables[104]: { tokenName, tokenType, collection, collectionId, variableId, scopes, webSyntax }
styles.text[8]: { name, id }
styles.effect[2]: { tokenName, name, styleId, webSyntax }
```

The sorted union of `variables[].tokenName` and `styles.effect[].tokenName` must equal the 106 source token names exactly once. Each variable’s collection, token type, scopes, collection ID, variable ID, and `var(--ds-...)` syntax must match its source token and readback. Each effect entry maps one shadow token to `Shadow/1` or `Shadow/2`. Mode IDs, alias target names, source/resolved values, and the complete projection stay in the ignored ledger because the committed verifier intentionally accepts only the exact schema above.

- [ ] **Step 7: Post the Phase 1 summary**

List the exact variable count per collection, all eight text styles, both effect styles, the 104+2=106 coverage proof, and the token-map path. Do not proceed when any scope, syntax, alias, font, ID, ordering, or coverage check fails.

### Task 3: Create page structure and Foundations documentation

**Files:**
- Modify locally, ignored: `figma/.state/design-system-v0.1.json`
- Modify: `figma/README.md`

**Interfaces:**
- Produces: all required pages and visual Foundation evidence.

- [ ] **Step 1: Post the Phase 2 checklist**

```text
P2.a Create/find ordered page skeleton
P2.b Build Cover, Principles, Getting Started, and Foundations docs
P2.c Capture every created documentation page and publish page list
```

- [ ] **Step 2: Create pages idempotently in batches**

Use this ordered list:

```js
const RUN_ID = 'design-system-v0.1-2026-07-10';
const PAGE_NAMES = [
  '00 Cover',
  '01 Principles',
  '02 Getting Started',
  '03 Foundations',
  '04 Components',
  '04.1 Icon',
  '04.2 Badge',
  '04.3 Button',
  '04.4 TextField',
  '90 Native Differences',
  '99 Deprecated',
];
```

Run the exact Page batch script above three times with `PAGE_NAMES.slice(0, 5)`, `PAGE_NAMES.slice(5, 10)`, and `PAGE_NAMES.slice(10)`. Then run the exact reorder script twice: indices 0–9 in the first call and index 10 in the second. Save all 11 returned page IDs and assert the final `figma.root.children` name prefix equals `PAGE_NAMES` exactly.

- [ ] **Step 3: Build documentation frames one page at a time**

Run the exact documentation-root script once for each row, passing the real `IBM Plex Sans KR` styles; `color/bg/canvas`, `color/text/primary`, `color/text/secondary`, `space/32`, and `space/64` variable IDs; and `Display`/`Body` text-style IDs from the ledger.

| Page | Title | Description |
|---|---|---|
| `00 Cover` | `Design System v0.1` | `모바일 우선 제품 경험을 위한 토큰, 컴포넌트, 사용 규칙입니다.` |
| `01 Principles` | `Principles` | `명확한 위계, 읽기 쉬운 정보, 하나의 주 행동, 절제된 장식을 기준으로 설계합니다.` |
| `02 Getting Started` | `Getting Started` | `Foundations를 확인한 뒤 컴포넌트 계약과 React 예제를 같은 이름으로 사용합니다.` |
| `03 Foundations` | `Foundations` | `코드 토큰과 동일한 색상, 간격, 크기, 타이포그래피, 반경, elevation 원본입니다.` |
| `04 Components` | `Components` | `Icon, Badge, Button, TextField의 목적, 변형, 상태, 접근성 계약을 제공합니다.` |

On `03 Foundations`, run the exact Foundation batch script repeatedly with at most two entries. Supply `color/bg/surface`, `color/text/primary`, `space/16`, `space/8`, and `space/12` as the chrome-variable IDs. Render every color variable as `color`; every `space/*` and `size/*` entry as `dimension`; every radius variable as `radius`; typography variables as `textVariable` with `font/family/* → fontFamily`, `font/size/* → fontSize`, `font/weight/* → fontWeight`, and `font/line-height/* → lineHeight`; all eight styles as `textStyle`; and both effect styles as `effectStyle`. Each item uses its exact readback ID, source name, and resolved value. The completed page must cover all 104 variables plus all 10 styles; every bindable value is bound, while the full CSS font stack is displayed verbatim and applied through approved `IBM Plex Sans KR` Text Styles rather than an invalid stack binding.

- [ ] **Step 4: Validate and screenshot every documentation page**

Call `get_metadata` then screenshot for `00 Cover`, `01 Principles`, `02 Getting Started`, `03 Foundations`, and `04 Components`. Inspect text clipping, overlap, hierarchy, bindings, and legibility. Show all five to the user.

- [ ] **Step 5: Obtain the Foundations visual approval**

If the user changes a value, update code token sources first through plan 01, regenerate artifacts, then update Figma variables/styles and repeat Phase 1/2 validation. Record approval evidence in `figma/README.md`.

### Task 4: Create and validate Icon

**Files:**
- Modify locally, ignored: `figma/.state/design-system-v0.1.json`
- Modify: `figma/README.md`
- Modify after readback: `apps/docs/src/content/components/icon.mdx`
- Regenerate after readback: `apps/docs/public/design-system/components.json`

- [ ] **Step 1: Confirm the frozen Icon contract from plan 03**

Purpose: communicate familiar interface actions without text duplication. Use for the five named functional glyphs; do not use as decoration when it adds no meaning. Accessibility: decorative in code unless labelled; Figma description states consumers must provide accessible text when the icon stands alone.

- [ ] **Step 2: Search libraries again and post the P3 Icon checklist**

Run `search_design_system('icon')`, record rebuild decision, then post `P3.a`–`P3.g`.

Run the documentation-root script on `04.1 Icon` with title `Icon` and this exact description: `익숙한 인터페이스 행동을 텍스트 중복 없이 전달합니다. 의미 없는 장식에는 사용하지 않고, 단독 사용 시 접근 가능한 이름을 제공합니다.` Use the same bound documentation chrome inputs as Task 3.

- [ ] **Step 3: Create five owned SVG components**

On `04.1 Icon`, run the exact Icon master script once. Its five `icons` entries are `{ name: 'Check', svg: ICON_SVGS.check }`, `{ name: 'ChevronRight', svg: ICON_SVGS['chevron-right'] }`, `{ name: 'Close', svg: ICON_SVGS.close }`, `{ name: 'Info', svg: ICON_SVGS.info }`, and `{ name: 'Search', svg: ICON_SVGS.search }`, where the SVG strings are copied byte-for-byte from `packages/react/src/icon/paths.ts`. Never reconstruct paths with rotated lines. The script produces five 24×24 owned components, binds width/height to `size/icon/large`, binds every present vector fill/stroke to `color/icon/primary`, tags them, and returns their IDs.

- [ ] **Step 4: Add 16/20/24 documented instances**

Run the exact Icon catalog script twice. Call 1 supplies these 10 `{name,size}` entries in order: Check/16, ChevronRight/16, Close/16, Info/16, Search/16, Check/20, ChevronRight/20, Close/20, Info/20, Search/20. Call 2 supplies Check/24, ChevronRight/24, Close/24, Info/24, Search/24. The script binds instance width/height to `size/icon/small`, `size/icon/medium`, or `size/icon/large`. These are documentation instances, not a `Name` or `Size` component variant axis. The stable Icon documentation URL is the returned `Icon Catalog` frame URL; retain five separate owned component node URLs.

- [ ] **Step 5: Validate Icon**

Use metadata to confirm `componentCount: 5`, the five exact component names, 24px masters, bound master/instance sizes, bound vector paints, and all 15 catalog instances. Screenshot the full page, show it, record the distinct `Icon Catalog` URL plus five distinct owned component URLs named `Icon/Check`, `Icon/ChevronRight`, `Icon/Close`, `Icon/Info`, and `Icon/Search`, and complete the Phase 3 summary. Icon evidence has `properties: []` and no `variantCount` field.

- [ ] **Step 6: Reconcile the Icon URL**

Write the `Icon Catalog` frame URL to `icon.mdx`, then run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
git add apps/docs/src/content/components/icon.mdx apps/docs/public/design-system/components.json
git diff --cached --check
git commit -m "docs(figma): link icon design source"
```

Expected: all checks and the commit succeed; only the remaining three component URLs may still be empty.

### Task 5: Create and validate Badge

**Files:**
- Modify locally, ignored: `figma/.state/design-system-v0.1.json`
- Modify: `figma/README.md`
- Modify after readback: `apps/docs/src/content/components/badge.mdx`
- Regenerate after readback: `apps/docs/public/design-system/components.json`

- [ ] **Step 1: Confirm contract and search libraries**

Purpose: show short, non-interactive status/category metadata. Do not use as a button or for long sentences. Run `search_design_system('badge')`, record rebuild, and post P3 checklist. Run the documentation-root script on `04.2 Badge` with title `Badge` and description `짧은 상태 또는 카테고리 정보를 표시합니다. 버튼이나 긴 문장에는 사용하지 않습니다.`

- [ ] **Step 2: Create the base and 16 variants**

On `04.2 Badge`, run the exact variant-batch script twice with these literal arrays:

```js
[
  { Size: 'Small', Variant: 'Soft', Tone: 'Neutral' },
  { Size: 'Small', Variant: 'Soft', Tone: 'Primary' },
  { Size: 'Small', Variant: 'Soft', Tone: 'Success' },
  { Size: 'Small', Variant: 'Soft', Tone: 'Danger' },
  { Size: 'Small', Variant: 'Solid', Tone: 'Neutral' },
  { Size: 'Small', Variant: 'Solid', Tone: 'Primary' },
  { Size: 'Small', Variant: 'Solid', Tone: 'Success' },
  { Size: 'Small', Variant: 'Solid', Tone: 'Danger' },
]
```

```js
[
  { Size: 'Medium', Variant: 'Soft', Tone: 'Neutral' },
  { Size: 'Medium', Variant: 'Soft', Tone: 'Primary' },
  { Size: 'Medium', Variant: 'Soft', Tone: 'Success' },
  { Size: 'Medium', Variant: 'Soft', Tone: 'Danger' },
  { Size: 'Medium', Variant: 'Solid', Tone: 'Neutral' },
  { Size: 'Medium', Variant: 'Solid', Tone: 'Primary' },
  { Size: 'Medium', Variant: 'Solid', Tone: 'Success' },
  { Size: 'Medium', Variant: 'Solid', Tone: 'Danger' },
]
```

Concatenate the two returned ID arrays in this order and run the exact combine/property script once. It combines the 16 variants as `Badge`, adds `Label` TEXT, wires every `label.characters`, lays out the set, and returns the exact property array.

- [ ] **Step 3: Validate Badge**

Assert `variantCount: 16`, exact Size/Variant/Tone axes and options, `properties: [{"name":"Label","type":"TEXT"}]`, no hard-coded product fill/text/padding/radius, and no unnamed nodes. Screenshot and inspect all combinations before recording the component-set URL and Phase 3 summary.

- [ ] **Step 4: Reconcile the Badge URL**

Write the Badge component-set URL to `badge.mdx`, then run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
git add apps/docs/src/content/components/badge.mdx apps/docs/public/design-system/components.json
git diff --cached --check
git commit -m "docs(figma): link badge design source"
```

### Task 6: Create and validate Button

**Files:**
- Modify locally, ignored: `figma/.state/design-system-v0.1.json`
- Modify: `figma/README.md`
- Modify after readback: `apps/docs/src/content/components/button.mdx`
- Regenerate after readback: `apps/docs/public/design-system/components.json`

- [ ] **Step 1: Confirm contract and search libraries**

Purpose: trigger the page’s primary or supporting action. Use one dominant fill action per view; do not use for navigation-only text or multiple competing primary actions. Run search and post P3 checklist. Run the documentation-root script on `04.3 Button` with title `Button` and description `페이지의 주요 또는 보조 행동을 실행합니다. 한 화면에서 강한 주요 행동을 경쟁시키지 않습니다.`

- [ ] **Step 2: Create the base component with properties**

On `04.3 Button`, use the exact variant-batch and combine/property scripts. They use the ledger’s `Icon/ChevronRight` ID for both default instance-swap slots, bind height/padding/gap/radius/background/border/text, create a last-child absolute `loading-overlay` containing a 20px arc spinner, and wire properties after the variants are combined. `Loading=true` makes the opaque, disabled-color overlay visible above leading icon, label, and trailing icon, matching React's effective disabled state; this is the explicit content-hiding mechanism. `Loading=false` hides that overlay and reveals normal content.

- [ ] **Step 3: Create and combine the 27 variants**

Run exactly three variant calls with these literal arrays, in order:

```js
[
  { Size: 'Small', Variant: 'Fill', State: 'Default' },
  { Size: 'Small', Variant: 'Fill', State: 'Pressed' },
  { Size: 'Small', Variant: 'Fill', State: 'Disabled' },
  { Size: 'Small', Variant: 'Weak', State: 'Default' },
  { Size: 'Small', Variant: 'Weak', State: 'Pressed' },
  { Size: 'Small', Variant: 'Weak', State: 'Disabled' },
  { Size: 'Small', Variant: 'Outline', State: 'Default' },
  { Size: 'Small', Variant: 'Outline', State: 'Pressed' },
  { Size: 'Small', Variant: 'Outline', State: 'Disabled' },
]
```

```js
[
  { Size: 'Medium', Variant: 'Fill', State: 'Default' },
  { Size: 'Medium', Variant: 'Fill', State: 'Pressed' },
  { Size: 'Medium', Variant: 'Fill', State: 'Disabled' },
  { Size: 'Medium', Variant: 'Weak', State: 'Default' },
  { Size: 'Medium', Variant: 'Weak', State: 'Pressed' },
  { Size: 'Medium', Variant: 'Weak', State: 'Disabled' },
  { Size: 'Medium', Variant: 'Outline', State: 'Default' },
  { Size: 'Medium', Variant: 'Outline', State: 'Pressed' },
  { Size: 'Medium', Variant: 'Outline', State: 'Disabled' },
]
```

```js
[
  { Size: 'Large', Variant: 'Fill', State: 'Default' },
  { Size: 'Large', Variant: 'Fill', State: 'Pressed' },
  { Size: 'Large', Variant: 'Fill', State: 'Disabled' },
  { Size: 'Large', Variant: 'Weak', State: 'Default' },
  { Size: 'Large', Variant: 'Weak', State: 'Pressed' },
  { Size: 'Large', Variant: 'Weak', State: 'Disabled' },
  { Size: 'Large', Variant: 'Outline', State: 'Default' },
  { Size: 'Large', Variant: 'Outline', State: 'Pressed' },
  { Size: 'Large', Variant: 'Outline', State: 'Disabled' },
]
```

Concatenate returned IDs Small → Medium → Large and run the combine/property script once. Loading remains a Boolean property, not a variant axis; width remains container guidance, not a variant.

- [ ] **Step 4: Validate Button**

Assert `variantCount: 27` and this ordered property array exactly: `Label/TEXT`, `Loading/BOOLEAN`, `Show leading icon/BOOLEAN`, `Show trailing icon/BOOLEAN`, `Leading icon/INSTANCE_SWAP`, `Trailing icon/INSTANCE_SWAP`. Toggle Loading false/true on an instance and visually verify normal content is visible only when uncovered and the spinner overlay is visible only when Loading is true. Audit all bindings, distinct size/state visuals, readable labels, and overlap. The 20px spinner width/height is bound to `size/icon/medium`; only the 1px structural stroke and arc geometry are documented non-token geometry. All product colors and spacing remain bound. Screenshot, show the page, record the component-set URL, and publish the Phase 3 summary.

- [ ] **Step 5: Reconcile the Button URL**

Write the Button component-set URL to `button.mdx`, then run:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
git add apps/docs/src/content/components/button.mdx apps/docs/public/design-system/components.json
git diff --cached --check
git commit -m "docs(figma): link button design source"
```

### Task 7: Create and validate TextField

**Files:**
- Modify locally, ignored: `figma/.state/design-system-v0.1.json`
- Modify: `figma/README.md`
- Modify after readback: `apps/docs/src/content/components/text-field.mdx`
- Regenerate after readback: `apps/docs/public/design-system/components.json`

- [ ] **Step 1: Confirm contract and precedence**

Purpose: collect one short text value with visible label and contextual feedback. Do not use for read-only data or multi-line content. State precedence is Disabled > Error > Focus > Default. In React, generated description/error IDs own `aria-describedby`; caller-supplied IDs are appended after generated IDs. `aria-invalid` is true whenever `errorMessage` exists and cannot be forced false by caller props.

Run the documentation-root script on `04.4 TextField` with title `TextField` and description `보이는 label과 문맥 피드백을 제공하며 짧은 텍스트 하나를 입력받습니다. 읽기 전용 데이터나 여러 줄 입력에는 사용하지 않습니다.`

- [ ] **Step 2: Search libraries and create eight variants**

On `04.4 TextField`, run search and post P3 checklist. Run the exact variant-batch script once with:

```js
[
  { Size: 'Medium', State: 'Default' },
  { Size: 'Medium', State: 'Focus' },
  { Size: 'Medium', State: 'Error' },
  { Size: 'Medium', State: 'Disabled' },
  { Size: 'Large', State: 'Default' },
  { Size: 'Large', State: 'Focus' },
  { Size: 'Large', State: 'Error' },
  { Size: 'Large', State: 'Disabled' },
]
```

Pass its eight returned IDs to the exact combine/property script. The scripts create label, field, value, description, and error nodes; keep description visible alongside error; bind product fill/stroke colors, padding, gap, radius, height, typography style/weight, and text colors; add four TEXT properties; and wire all `characters` references. The 320px width is a documented resizable preview default rather than a variant or product token, and the 1px stroke is structural geometry.

- [ ] **Step 3: Validate TextField**

Assert `variantCount: 8`, exact Size/State axes/options, and ordered properties `Label/TEXT`, `Value/TEXT`, `Description/TEXT`, `Error/TEXT`. Verify state precedence in documentation, description-plus-error parity with React, zero unbound product styling values beyond the documented resizable width/structural stroke, and no clipped helper/error text. Screenshot, show it, record the component-set URL, and publish Phase 3 summary.

- [ ] **Step 4: Reconcile the TextField URL**

Write the TextField component-set URL to `text-field.mdx`, then run the complete reconciliation and release gate immediately:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
corepack pnpm --filter @maxxuxx/docs manifest:release-check
git add apps/docs/src/content/components/text-field.mdx apps/docs/public/design-system/components.json
git diff --cached --check
git commit -m "docs(figma): link text field design source"
```

Expected: `manifest:release-check` is silent and exits `0` because all four component URLs are now distinct and non-empty; the commit succeeds. Task 8 readback evidence remains required for v0.1 completion.

### Task 8: Complete Phase 4 integration and QA

**Files:**
- Modify: `figma/README.md`
- Modify: `figma/token-map.json`
- Create: `figma/verification.json`
- Modify: `apps/docs/src/content/components/icon.mdx`
- Modify: `apps/docs/src/content/components/badge.mdx`
- Modify: `apps/docs/src/content/components/button.mdx`
- Modify: `apps/docs/src/content/components/text-field.mdx`
- Regenerate: `apps/docs/public/design-system/components.json`

- [ ] **Step 1: Rehydrate before the final audit**

Read the ledger, then run a read-only scan matching `dsb/key` across each known target page. Compare IDs/names to the ledger, repair ledger drift, and stop on duplicate logical keys.

- [ ] **Step 2: Post the exact Phase 4 checklist**

```text
P4.a Code Connect — explicitly skipped by v0.1 scope
P4.b Accessibility — contrast, 44px Button/TextField targets, focus/state clarity
P4.c Naming — pages, variables, styles, components, variants, child nodes
P4.d Bindings and parity — no unresolved product values; Figma properties match React contracts
P4.e Final screenshots — every page
```

- [ ] **Step 3: Run structural audits**

For each component set, inspect child counts, variant options, component property definitions, shared plugin keys, and bound variables. Check all local variables for scopes/syntax/aliases. Check every relevant scene node for hard-coded fill/stroke/spacing/radius only after narrowing by node type/capability.

- [ ] **Step 4: Capture every page**

Capture all 11 pages, including empty-state pages `90 Native Differences` and `99 Deprecated`. Verify no draft copy, clipped text, overlapping variants, or stale status. Present a page list with screenshots.

- [ ] **Step 5: Update committed Figma metadata and machine-readable evidence**

Regenerate `figma/token-map.json` from the final readback using the exact schema in Task 2. Assert five ordered collections, 104 variable rows, eight ordered text-style rows, two ordered effect-style rows, 106 unique source-token mappings, 26 Semantic Color rows, 57 COLOR rows, matching collection counts/IDs, exact scopes, non-empty variable/style IDs, `Default` mode evidence, and exact WEB syntax. Reject broken aliases or any `ALL_SCOPES` value before writing.

Create `figma/verification.json` only from final readback, with exactly these top-level fields: `schemaVersion`, `fileUrl`, `verifiedAt`, `codeConnect`, `collections`, `textStyleCount`, `effectStyleCount`, `pages`, `components`, `foundations`, `pageScreenshotNodeIds`, `allPagesScreenshotReviewed`, and `hardCodedProductValues`. Required scalar/list values are `schemaVersion: 1`, a private `/design/` file URL, an ISO timestamp, `codeConnect: "skipped-v0.1"`, the five ordered collection names, `textStyleCount: 8`, `effectStyleCount: 2`, the exact 11-page order from Task 3, `allPagesScreenshotReviewed: true`, and `hardCodedProductValues: 0`.

`components` must use this exact plan-05-compatible contract and field order:

| Key | Exact evidence |
|---|---|
| `Icon` | `catalogUrl`; `componentCount: 5`; `componentUrls` containing exactly `{name,url}` for `Icon/Check`, `Icon/ChevronRight`, `Icon/Close`, `Icon/Info`, `Icon/Search` in that order; `properties: []`; `screenshotReviewed: true`; `bindingsAudited: true`; `propParity: true` |
| `Badge` | `componentSetUrl`; `variantCount: 16`; `properties: [{"name":"Label","type":"TEXT"}]`; the same three true audit booleans |
| `Button` | `componentSetUrl`; `variantCount: 27`; `properties: [{"name":"Label","type":"TEXT"},{"name":"Loading","type":"BOOLEAN"},{"name":"Show leading icon","type":"BOOLEAN"},{"name":"Show trailing icon","type":"BOOLEAN"},{"name":"Leading icon","type":"INSTANCE_SWAP"},{"name":"Trailing icon","type":"INSTANCE_SWAP"}]`; the same three true audit booleans |
| `TextField` | `componentSetUrl`; `variantCount: 8`; `properties: [{"name":"Label","type":"TEXT"},{"name":"Value","type":"TEXT"},{"name":"Description","type":"TEXT"},{"name":"Error","type":"TEXT"}]`; the same three true audit booleans |

All nine node URLs above—the Icon catalog, five owned icon components, and three component sets—must be valid and mutually distinct. `foundations` contains exactly the fields `approved: true`, `approvedAt`, and `tokenParity: true`; `approvedAt` is the actual recorded approval time serialized as an ISO timestamp. `tokenParity: true` requires the `font/family/sans` STRING variable to equal the generated full stack exactly; Text Styles using the installed `IBM Plex Sans KR` family do not alter that variable. `pageScreenshotNodeIds` contains exactly all 11 page names as keys and each page’s actual non-empty screenshot target node ID as its value: `00 Cover`, `01 Principles`, `02 Getting Started`, `03 Foundations`, `04 Components`, `04.1 Icon`, `04.2 Badge`, `04.3 Button`, `04.4 TextField`, `90 Native Differences`, and `99 Deprecated`.

Replace each component MDX frontmatter `figmaUrl` with its actual documentation target URL from the same readback: the `Icon Catalog` frame for Icon and the component-set node for Badge, Button, and TextField. Do not copy the file-level URL into all four entries. Then regenerate and check the manifest so `/design-system/components.json` contains the four distinct, non-empty node URLs:

```powershell
corepack pnpm --filter @maxxuxx/docs manifest:write
corepack pnpm --filter @maxxuxx/docs manifest:check
corepack pnpm --filter @maxxuxx/docs build
corepack pnpm --filter @maxxuxx/docs manifest:release-check
```

Expected: all four commands exit 0; the manifest has one matching Figma target URL per component, Icon points to the catalog rather than an owned master, and the static docs still build.

- [ ] **Step 6: Commit metadata only after readback**

```powershell
git add figma/README.md figma/token-map.json figma/verification.json apps/docs/src/content/components apps/docs/public/design-system/components.json
git diff --cached --check
git commit -m "docs(figma): record design system library verification"
```

Expected: commit succeeds locally. Do not push until GitHub visibility is Private.
