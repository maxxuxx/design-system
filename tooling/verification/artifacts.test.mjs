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
  if (token.name.startsWith('space/') || token.name.startsWith('size/')) return 'Spacing';
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
        tokenType: token.type === 'color' ? 'COLOR' : token.type === 'fontFamily' ? 'STRING' : 'FLOAT',
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
