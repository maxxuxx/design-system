import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
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
  'components/text-field/index.html', 'components/scroll-area/index.html',
  'components/checkbox/index.html', 'components/radio-group/index.html',
  'components/switch/index.html', 'components/textarea/index.html',
  'components/select/index.html',
];

const collectionNames = ['Primitives', 'Semantic Color', 'Spacing', 'Typography', 'Radius'];
const textStyleNames = ['Display', 'Heading', 'Title', 'Body/Large', 'Body', 'Body/Small', 'Caption', 'Label'];
const pageNames = [
  '00 Cover', '01 Principles', '02 Getting Started', '03 Foundations',
  '04 Components', '04.1 Icon', '04.2 Badge', '04.3 Button',
  '04.4 TextField', '04.5 ScrollArea', '04.6 Checkbox', '04.7 RadioGroup',
  '04.8 Switch', '04.9 Textarea', '04.10 Select',
  '90 Native Differences', '99 Deprecated',
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
    variantCount: 16,
    variants: ['soft', 'solid', 'neutral', 'primary', 'success', 'danger'],
    sizes: ['small', 'medium'], states: ['default'],
  },
  {
    name: 'Button', slug: 'button', variants: ['fill', 'weak', 'outline'],
    variantCount: 27,
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'hover', 'pressed', 'focus-visible', 'disabled', 'loading'],
  },
  {
    name: 'TextField', slug: 'text-field', variants: [],
    variantCount: 8,
    sizes: ['medium', 'large'], states: ['default', 'focus', 'error', 'disabled'],
  },
  {
    name: 'ScrollArea', slug: 'scroll-area', variants: [], sizes: [],
    variantCount: 4,
    states: ['no-overflow', 'start', 'middle', 'end'],
  },
  {
    name: 'Checkbox', slug: 'checkbox', variantCount: 18,
    variants: ['unchecked', 'checked', 'indeterminate'],
    sizes: ['small', 'medium'], states: ['default', 'error', 'disabled'],
  },
  {
    name: 'RadioGroup', slug: 'radio-group', variantCount: 18,
    variants: ['none', 'first', 'second'],
    sizes: ['small', 'medium'], states: ['default', 'error', 'disabled'],
  },
  {
    name: 'Switch', slug: 'switch', variantCount: 12,
    variants: ['off', 'on'],
    sizes: ['small', 'medium'], states: ['default', 'error', 'disabled'],
  },
  {
    name: 'Textarea', slug: 'textarea', variantCount: 8,
    variants: ['vertical', 'none'],
    sizes: ['medium', 'large'], states: ['default', 'focus', 'error', 'disabled'],
  },
  {
    name: 'Select', slug: 'select', variantCount: 8, variants: [],
    sizes: ['medium', 'large'], states: ['default', 'focus', 'error', 'disabled'],
  },
];

const manifestProps = {
  Icon: [
    { name: 'name', type: 'IconName', required: true, defaultValue: null },
    { name: 'size', type: 'IconSize', required: false, defaultValue: '24' },
    { name: 'label', type: 'string', required: false, defaultValue: null },
    {
      name: '...svgProps',
      type: "Omit<SVGProps<SVGSVGElement>, 'children' | 'role' | 'aria-label' | 'aria-labelledby' | 'aria-hidden' | 'tabIndex' | 'focusable' | 'dangerouslySetInnerHTML' | 'style' | 'width' | 'height' | 'viewBox' | 'fill' | 'stroke' | 'strokeLinecap' | 'strokeLinejoin'>",
      required: false,
      defaultValue: null,
    },
  ],
  Badge: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'size', type: 'BadgeSize', required: false, defaultValue: 'medium' },
    { name: 'variant', type: 'BadgeVariant', required: false, defaultValue: 'soft' },
    { name: 'tone', type: 'BadgeTone', required: false, defaultValue: 'neutral' },
    {
      name: '...spanProps',
      type: 'HTMLAttributes<HTMLSpanElement>',
      required: false,
      defaultValue: null,
    },
  ],
  Button: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'size', type: 'ButtonSize', required: false, defaultValue: 'medium' },
    { name: 'variant', type: 'ButtonVariant', required: false, defaultValue: 'fill' },
    { name: 'width', type: 'ButtonWidth', required: false, defaultValue: 'hug' },
    { name: 'loading', type: 'boolean', required: false, defaultValue: 'false' },
    {
      name: 'leadingIcon',
      type: 'ReactElement<IconProps, typeof Icon>',
      required: false,
      defaultValue: null,
    },
    {
      name: 'trailingIcon',
      type: 'ReactElement<IconProps, typeof Icon>',
      required: false,
      defaultValue: null,
    },
    {
      name: '...buttonProps',
      type: 'ButtonHTMLAttributes<HTMLButtonElement>',
      required: false,
      defaultValue: null,
    },
  ],
  TextField: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'TextFieldSize', required: false, defaultValue: 'medium' },
    { name: 'type', type: 'TextFieldType', required: false, defaultValue: 'text' },
    {
      name: '...inputProps',
      type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>",
      required: false,
      defaultValue: null,
    },
  ],
  ScrollArea: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'scrollUpLabel', type: 'string', required: true, defaultValue: null },
    { name: 'scrollDownLabel', type: 'string', required: true, defaultValue: null },
    { name: 'viewportRef', type: 'Ref<HTMLDivElement>', required: false, defaultValue: null },
    {
      name: 'onViewportScroll',
      type: 'UIEventHandler<HTMLDivElement>',
      required: false,
      defaultValue: null,
    },
    {
      name: '...rootProps',
      type: "Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onScroll'>",
      required: false,
      defaultValue: null,
    },
  ],
  Checkbox: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'indeterminate', type: 'boolean', required: false, defaultValue: 'false' },
    { name: 'size', type: 'CheckboxSize', required: false, defaultValue: 'medium' },
    {
      name: '...inputProps',
      type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>",
      required: false,
      defaultValue: null,
    },
  ],
  RadioGroup: [
    { name: 'legend', type: 'string', required: true, defaultValue: null },
    { name: 'name', type: 'string', required: true, defaultValue: null },
    { name: 'options', type: 'readonly RadioGroupOption[]', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'RadioGroupSize', required: false, defaultValue: 'medium' },
    { name: 'value', type: 'string', required: false, defaultValue: null },
    { name: 'defaultValue', type: 'string', required: false, defaultValue: null },
    { name: 'required', type: 'boolean', required: false, defaultValue: 'false' },
    {
      name: 'onChange',
      type: 'ChangeEventHandler<HTMLInputElement>',
      required: false,
      defaultValue: null,
    },
    {
      name: '...fieldsetProps',
      type: "Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children' | 'onChange'>",
      required: false,
      defaultValue: null,
    },
  ],
  Switch: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'SwitchSize', required: false, defaultValue: 'medium' },
    {
      name: '...inputProps',
      type: "Omit<InputHTMLAttributes<HTMLInputElement>, 'role' | 'size' | 'type'>",
      required: false,
      defaultValue: null,
    },
  ],
  Textarea: [
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'TextareaSize', required: false, defaultValue: 'medium' },
    { name: 'resize', type: 'TextareaResize', required: false, defaultValue: 'vertical' },
    {
      name: '...textareaProps',
      type: "Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>",
      required: false,
      defaultValue: null,
    },
  ],
  Select: [
    { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
    { name: 'label', type: 'string', required: true, defaultValue: null },
    { name: 'description', type: 'string', required: false, defaultValue: null },
    { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
    { name: 'placeholder', type: 'string', required: false, defaultValue: null },
    { name: 'size', type: 'SelectSize', required: false, defaultValue: 'medium' },
    {
      name: '...selectProps',
      type: "Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'multiple' | 'size'>",
      required: false,
      defaultValue: null,
    },
  ],
};

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
  ScrollArea: [],
  Checkbox: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  RadioGroup: [
    { name: 'Legend', type: 'TEXT' },
    { name: 'Option 1', type: 'TEXT' },
    { name: 'Option 2', type: 'TEXT' },
    { name: 'Option 3', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  Switch: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  Textarea: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Value', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
  Select: [
    { name: 'Label', type: 'TEXT' },
    { name: 'Value', type: 'TEXT' },
    { name: 'Description', type: 'TEXT' },
    { name: 'Error', type: 'TEXT' },
  ],
};

const componentNodeIds = {
  Icon: '31-2',
  Badge: '47-2',
  Button: '65-56',
  TextField: '80-50',
  ScrollArea: '92-2',
  Checkbox: '139-176',
  RadioGroup: '147-272',
  Switch: '153-122',
  Textarea: '158-56',
  Select: '168-72',
};

const iconNodeIds = ['30-4', '30-7', '30-11', '30-16', '30-20'];

const fixtureComponentTokens = {
  Icon: ['color/icon/primary'],
  Badge: ['space/1', 'color/semantic/1'],
  Button: ['size/control/1', 'color/semantic/2'],
  TextField: ['font/size/1', 'color/semantic/3'],
  ScrollArea: ['blur/subtle'],
  Checkbox: ['size/control/9', 'color/semantic/4'],
  RadioGroup: ['size/control/10', 'color/semantic/5'],
  Switch: ['size/control/11', 'color/semantic/6'],
  Textarea: ['size/control/12', 'color/semantic/7'],
  Select: ['size/control/13', 'color/semantic/8'],
};

function figmaUrl(id) {
  return `https://www.figma.com/design/file?node-id=${encodeURIComponent(id)}`;
}

function withQuery(url, name, value) {
  const parsed = new URL(url);
  parsed.searchParams.set(name, value);
  return parsed.toString();
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function tokenValuesSha256(tokens) {
  const canonical = tokens
    .filter(({ type }) => type !== 'shadow')
    .map(({ name, value, resolvedValue }) => ({
      tokenName: name,
      sourceValue: value,
      resolvedValue,
    }));
  return sha256(JSON.stringify(canonical));
}

function parseShadow(value) {
  const match = value.match(
    /^(-?\d+(?:\.\d+)?)(?:px)? (-?\d+(?:\.\d+)?)px (\d+(?:\.\d+)?)px rgba\((\d+), (\d+), (\d+), (\d+(?:\.\d+)?)\)$/,
  );
  assert.ok(match, `Unsupported fixture shadow: ${value}`);
  return {
    type: 'DROP_SHADOW',
    color: {
      r: Number(match[4]),
      g: Number(match[5]),
      b: Number(match[6]),
      a: Number(match[7]),
    },
    offset: { x: Number(match[1]), y: Number(match[2]) },
    radius: Number(match[3]),
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  };
}

function makeEffectReadback(tokens) {
  return tokens
    .filter(({ type }) => type === 'shadow')
    .map((token, index) => ({
      tokenName: token.name,
      styleId: `effect-style:${index + 1}`,
      name: `Shadow/${index + 1}`,
      description: token.description,
      effects: [parseShadow(token.resolvedValue)],
    }));
}

function effectValuesSha256(effectReadback) {
  return sha256(JSON.stringify(effectReadback));
}

function makeTokens() {
  return Array.from({ length: 113 }, (_, index) => {
    const kind = index < 87 ? 'primitive' : 'semantic';
    let name;
    let type;
    if (index < 31) {
      name = `color/primitive/${index + 1}`;
      type = 'color';
    } else if (index < 43) {
      name = `space/${index - 30}`;
      type = 'dimension';
    } else if (index < 57) {
      name = `size/control/${index - 42}`;
      type = 'dimension';
    } else if (index < 63) {
      name = `radius/${index - 56}`;
      type = 'dimension';
    } else if (index < 71) {
      name = `font/size/${index - 62}`;
      type = 'dimension';
    } else if (index < 79) {
      name = `font/line-height/${index - 70}`;
      type = 'dimension';
    } else if (index < 83) {
      name = `font/weight/${index - 78}`;
      type = 'fontWeight';
    } else if (index === 83) {
      name = 'font/family/sans';
      type = 'fontFamily';
    } else if (index < 86) {
      name = `elevation/${index - 83}`;
      type = 'shadow';
    } else if (index === 86) {
      name = 'blur/subtle';
      type = 'dimension';
    } else {
      name = index === 87 ? 'color/icon/primary' : `color/semantic/${index - 87}`;
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
          description: token.description,
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
    figmaUrl: figmaUrl(componentNodeIds[name]),
    frameworks: { react: 'preview', svelte: 'planned', reactNative: 'planned' },
    variants,
    sizes,
    states,
    accessibility: `${name} accessibility contract`,
    props: manifestProps[name].map((prop) => ({
      ...prop,
      description: `${prop.name} property`,
    })),
    tokens: fixtureComponentTokens[name],
    docsUrl: `/components/${slug}/`,
  }));
}

function makeVerification(tokens) {
  const effectReadback = makeEffectReadback(tokens);
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
    tokenValuesSha256: tokenValuesSha256(tokens),
    effectValuesSha256: effectValuesSha256(effectReadback),
    effectReadback,
    pageScreenshotSha256: Object.fromEntries(
      pageNames.map((page) => [page, sha256(`screenshot:${page}`)]),
    ),
    components: Object.fromEntries(componentSpecs.map((spec) => {
      if (spec.name === 'Icon') return ['Icon', {
        catalogUrl: figmaUrl(componentNodeIds.Icon),
        componentCount: 5,
        componentUrls: ['Icon/Check', 'Icon/ChevronRight', 'Icon/Close', 'Icon/Info', 'Icon/Search']
          .map((name, index) => ({ name, url: figmaUrl(iconNodeIds[index]) })),
        properties: properties.Icon,
        ...shared,
      }];
      return [spec.name, {
        componentSetUrl: figmaUrl(componentNodeIds[spec.name]),
        variantCount: spec.variantCount,
        properties: properties[spec.name],
        ...shared,
      }];
    })),
    foundations: {
      approved: true,
      approvedAt: '2026-07-10T11:00:00+09:00',
      tokenParity: true,
    },
    pageScreenshotNodeIds: Object.fromEntries(
      pageNames.map((page, index) => [page, `${index + 10}:${index + 2}`]),
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
  for (const { name, slug } of componentSpecs) {
    const sourceDir = path.join(root, 'packages', 'react', 'src', slug);
    await mkdir(sourceDir, { recursive: true });
    const declarations = fixtureComponentTokens[name]
      .map((tokenName, index) => `--fixture-${index}: var(--ds-${tokenName.replaceAll('/', '-')});`)
      .join(' ');
    const localVariableContract = name === 'ScrollArea'
      ? '--ds-scroll-area-edge-size: var(--ds-blur-subtle); height: var(--ds-scroll-area-edge-size); '
      : name === 'Switch'
        ? '--ds-switch-track-width: var(--ds-size-control-11); '
          + '--ds-switch-track-height: var(--ds-size-control-11); '
          + 'width: var(--ds-switch-track-width); height: var(--ds-switch-track-height); '
        : '';
    await writeFile(
      path.join(sourceDir, `${name}.css`),
      `.fixture { ${localVariableContract}${declarations} } /* var(--ds-commented-out-token) */`,
    );
  }
  const figmaDir = path.join(root, 'figma');
  await mkdir(figmaDir, { recursive: true });
  await writeFile(path.join(figmaDir, 'token-map.json'), JSON.stringify(makeTokenMap(tokens)));
  await writeFile(path.join(figmaDir, 'verification.json'), JSON.stringify(makeVerification(tokens)));
  return root;
}

test('accepts a complete build, 113-token map, ten-component manifest, and Figma evidence', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(await verifyBuildArtifacts(root), []);
  assert.deepEqual(await verifyFigmaEvidence(root), []);
});

test('accepts equivalent Figma node URLs with additional query metadata', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(file, 'utf8'));
  manifest.components[0].figmaUrl = withQuery(manifest.components[0].figmaUrl, 'source', 'manifest');
  await writeFile(file, JSON.stringify(manifest));
  assert.deepEqual(await verifyFigmaEvidence(root), []);
});

test('reports every missing v0.2 static route', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const newRoutes = ['checkbox', 'radio-group', 'switch', 'textarea', 'select'];
  await Promise.all(newRoutes.map((slug) => rm(
    path.join(root, 'apps', 'docs', 'dist', 'components', slug, 'index.html'),
  )));
  const violations = await verifyBuildArtifacts(root);
  for (const slug of newRoutes) {
    assert.ok(violations.includes(`Missing build artifact: components/${slug}/index.html`));
  }
});

test('rejects an extra static HTML route beyond the exact 18-route contract', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const extra = path.join(root, 'apps', 'docs', 'dist', 'components', 'invented', 'index.html');
  await mkdir(path.dirname(extra), { recursive: true });
  await writeFile(extra, '<!doctype html><h1>invented</h1>');
  assert.ok((await verifyBuildArtifacts(root))
    .includes('Static HTML routes must be exactly the 18 canonical routes'));
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
  assert.ok(violations.some((value) => value.includes('exactly 113 tokens')));
  assert.ok(violations.some((value) => value.includes('exactly 87 primitive tokens')));
  assert.ok(violations.some((value) => value.includes('exactly 26 semantic tokens')));
  assert.ok(violations.some((value) => value.includes('invalid kind')));
  assert.ok(violations.some((value) => value.includes('cssVariable mismatch')));
  assert.ok(violations.some((value) => value.includes('missing resolvedValue')));
});

test('rejects component order, status, full-field, prop, and distinct-URL drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.components.pop();
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
  assert.ok(violations.some((value) => value.includes('exactly 10 components')));
  assert.ok(violations.some((value) => value.includes('Component index 0 must be Icon')));
  assert.ok(violations.some((value) => value.includes('status must be preview')));
  assert.ok(violations.some((value) => value.includes('description must be non-empty')));
  assert.ok(violations.some((value) => value.includes('missing accessibility')));
  assert.ok(violations.some((value) => value.includes('variants must be a string array')));
  assert.ok(violations.some((value) => value.includes('prop 0 required must be boolean')));
  assert.ok(violations.some((value) => value.includes('tokens must be a non-empty string array')));
  assert.ok(violations.some((value) => value.includes('ten distinct Figma URLs')));
});

test('rejects exact public component prop-contract drift', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.components.find(({ name }) => name === 'Icon').props.at(-1).type =
    'SVGProps<SVGSVGElement>';
  artifact.components.find(({ name }) => name === 'Button').props
    .find(({ name }) => name === 'leadingIcon').type = 'ReactElement<IconProps>';
  artifact.components.find(({ name }) => name === 'TextField').props
    .find(({ name }) => name === 'type').type = 'string';
  artifact.components.find(({ name }) => name === 'ScrollArea').props
    .find(({ name }) => name === 'viewportRef').type = 'MutableRefObject<HTMLDivElement>';
  artifact.components.find(({ name }) => name === 'Checkbox').props
    .find(({ name }) => name === 'indeterminate').defaultValue = 'true';
  artifact.components.find(({ name }) => name === 'RadioGroup').props
    .find(({ name }) => name === 'options').type = 'RadioGroupOption[]';
  artifact.components.find(({ name }) => name === 'Switch').props
    .find(({ name }) => name === '...inputProps').type = 'InputHTMLAttributes<HTMLInputElement>';
  artifact.components.find(({ name }) => name === 'Textarea').props
    .find(({ name }) => name === 'resize').type = 'string';
  artifact.components.find(({ name }) => name === 'Select').props
    .find(({ name }) => name === '...selectProps').type = 'SelectHTMLAttributes<HTMLSelectElement>';
  await writeFile(file, JSON.stringify(artifact));

  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.includes('Icon prop contract mismatch'));
  assert.ok(violations.includes('Button prop contract mismatch'));
  assert.ok(violations.includes('TextField prop contract mismatch'));
  assert.ok(violations.includes('ScrollArea prop contract mismatch'));
  assert.ok(violations.includes('Checkbox prop contract mismatch'));
  assert.ok(violations.includes('RadioGroup prop contract mismatch'));
  assert.ok(violations.includes('Switch prop contract mismatch'));
  assert.ok(violations.includes('Textarea prop contract mismatch'));
  assert.ok(violations.includes('Select prop contract mismatch'));
});

test('rejects every missing v0.2 component manifest record', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  const names = ['Checkbox', 'RadioGroup', 'Switch', 'Textarea', 'Select'];
  artifact.components = artifact.components.filter(({ name }) => !names.includes(name));
  await writeFile(file, JSON.stringify(artifact));

  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.includes('components.json must contain exactly 10 components'));
  names.forEach((name, offset) => {
    assert.ok(violations.includes(`Component index ${offset + 5} must be ${name}`));
  });
});

test('rejects token-contract drift for every new form control', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const names = ['Checkbox', 'RadioGroup', 'Switch', 'Textarea', 'Select'];
  const removed = Object.fromEntries(names.map((name) => {
    const component = manifest.components.find((entry) => entry.name === name);
    return [name, component.tokens.shift()];
  }));
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyBuildArtifacts(root);
  for (const name of names) {
    assert.ok(violations.includes(`${name} manifest tokens omit CSS token: ${removed[name]}`));
  }
});

test('rejects unknown, omitted, invented, and duplicate component token declarations', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const badgeCss = path.join(root, 'packages', 'react', 'src', 'badge', 'Badge.css');
  await writeFile(badgeCss, [
    await readFile(badgeCss, 'utf8'),
    '.drift {',
    '  --missing: var(--ds-space-2);',
    '  --ds-not-a-token: 1px;',
    '  --unknown: var(--ds-not-a-token);',
    '}',
  ].join('\n'));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  const badge = manifest.components.find(({ name }) => name === 'Badge');
  badge.tokens.push('radius/1', 'invented/token', badge.tokens[0]);
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyBuildArtifacts(root);
  assert.ok(violations.includes('Badge CSS references unknown token variable: --ds-not-a-token'));
  assert.ok(violations.includes('Badge manifest tokens omit CSS token: space/2'));
  assert.ok(violations.includes('Badge manifest tokens include unused CSS token: radius/1'));
  assert.ok(violations.includes('Badge manifest tokens include unknown token: invented/token'));
  assert.ok(violations.includes('Badge manifest tokens contain duplicate token: space/1'));
});

test('rejects a missing component CSS source', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await rm(path.join(root, 'packages', 'react', 'src', 'button', 'Button.css'));
  assert.ok((await verifyBuildArtifacts(root))
    .includes('Button CSS source is unreadable: packages/react/src/button/Button.css'));
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
  tokenMap.collections.find(({ name }) => name === 'Primitives').variableCount = 31;
  tokenMap.collections.find(({ name }) => name === 'Spacing').variableCount = 25;
  tokenMap.styles.effect[0].description = 'drifted description';
  await writeFile(file, JSON.stringify(tokenMap));
  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('token-name mapping must equal tokens.json')));
  assert.ok(violations.some((value) => value.includes('exactly 111 variables')));
  assert.ok(violations.some((value) => value.includes('Primitives collection must contain exactly 32 variables')));
  assert.ok(violations.some((value) => value.includes('Spacing collection must contain exactly 26 variables')));
  assert.ok(violations.some((value) => value.includes('Primitives variableCount must be 32')));
  assert.ok(violations.some((value) => value.includes('WEB syntax mismatch')));
  assert.ok(violations.some((value) => value.includes('variable fields mismatch')));
  assert.ok(violations.some((value) => value.includes('scopes mismatch')));
  assert.ok(violations.some((value) => value.includes('effect style description mismatch')));
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
  evidence.components.ScrollArea.variantCount = 3;
  evidence.components.ScrollArea.properties = [{ name: 'Content', type: 'TEXT' }];
  evidence.components.Checkbox.variantCount = 17;
  evidence.components.Checkbox.properties.pop();
  evidence.components.RadioGroup.variantCount = 17;
  evidence.components.RadioGroup.properties[1].name = 'First option';
  evidence.components.Switch.variantCount = 11;
  evidence.components.Switch.properties[0].type = 'BOOLEAN';
  evidence.components.Textarea.variantCount = 7;
  evidence.components.Textarea.properties.pop();
  evidence.components.Select.variantCount = 7;
  evidence.components.Select.properties[1].name = 'Selection';
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
  assert.ok(violations.some((value) => value.includes('ScrollArea variantCount must be 4')));
  assert.ok(violations.some((value) => value.includes('ScrollArea property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Checkbox variantCount must be 18')));
  assert.ok(violations.some((value) => value.includes('Checkbox property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('RadioGroup variantCount must be 18')));
  assert.ok(violations.some((value) => value.includes('RadioGroup property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Switch variantCount must be 12')));
  assert.ok(violations.some((value) => value.includes('Switch property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Textarea variantCount must be 8')));
  assert.ok(violations.some((value) => value.includes('Textarea property definitions mismatch')));
  assert.ok(violations.some((value) => value.includes('Select variantCount must be 8')));
  assert.ok(violations.some((value) => value.includes('Select property definitions mismatch')));
});

test('rejects every missing v0.2 Figma component and page record', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  const records = [
    ['Checkbox', '04.6 Checkbox'],
    ['RadioGroup', '04.7 RadioGroup'],
    ['Switch', '04.8 Switch'],
    ['Textarea', '04.9 Textarea'],
    ['Select', '04.10 Select'],
  ];
  for (const [name, page] of records) {
    delete evidence.components[name];
    delete evidence.pageScreenshotSha256[page];
    delete evidence.pageScreenshotNodeIds[page];
  }
  await writeFile(file, JSON.stringify(evidence));

  const violations = await verifyFigmaEvidence(root);
  for (const [name, page] of records) {
    assert.ok(violations.includes(`Missing Figma evidence: ${name}`));
    assert.ok(violations.includes(`${page} screenshot SHA-256 is required`));
    assert.ok(violations.includes(`${page} screenshot node ID is required`));
  }
});

test('rejects exact Figma page, style, and component-set totals', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pages = evidence.pages.filter((page) => page !== '04.10 Select');
  evidence.textStyleCount = 7;
  evidence.effectStyleCount = 1;
  delete evidence.components.Select.componentSetUrl;
  await writeFile(file, JSON.stringify(evidence));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Figma page list mismatch'));
  assert.ok(violations.includes('Figma textStyleCount must be 8'));
  assert.ok(violations.includes('Figma effectStyleCount must be 2'));
  assert.ok(violations.includes('Figma evidence must expose exactly nine component sets'));
  assert.ok(violations.includes('Select evidence fields mismatch'));
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
  manifest.components[0].figmaUrl = figmaUrl('999-9');
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('Code Connect must be skipped-v0.1')));
  assert.ok(violations.some((value) => value.includes('Foundations approval')));
  assert.ok(violations.some((value) => value.includes('04.2 Badge screenshot node')));
  assert.ok(violations.some((value) => value.includes('hard-coded product values')));
  assert.ok(violations.some((value) => value.includes('Icon manifest Figma URL')));
});

test('rejects token value drift from the canonical Figma digest', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'tokens.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  artifact.tokens[0].value = '#445566';
  artifact.tokens[0].resolvedValue = '#445566';
  await writeFile(file, JSON.stringify(artifact));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma tokenValuesSha256 must match code token values'));
});

test('rejects effect value drift from the canonical Figma digest', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'tokens.json');
  const artifact = JSON.parse(await readFile(file, 'utf8'));
  const shadow = artifact.tokens.find(({ name }) => name === 'elevation/1');
  shadow.value = '0 2px 4px rgba(0, 0, 0, 0.1)';
  shadow.resolvedValue = '0 2px 4px rgba(0, 0, 0, 0.1)';
  await writeFile(file, JSON.stringify(artifact));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma effect readback must match code effect values'));
});

test('rejects live Figma effect readback drift even with a refreshed digest', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.effectReadback[0].effects[0].radius = 99;
  evidence.effectValuesSha256 = effectValuesSha256(evidence.effectReadback);
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma effect readback must match code effect values'));
});

test('rejects malformed token and page screenshot SHA-256 evidence', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.tokenValuesSha256 = 'not-a-digest';
  evidence.effectValuesSha256 = 'short';
  evidence.pageScreenshotSha256['01 Principles'] = 'short';
  delete evidence.pageScreenshotSha256['04.2 Badge'];
  evidence.pageScreenshotSha256.Extra = '0'.repeat(64);
  await writeFile(file, JSON.stringify(evidence));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Figma tokenValuesSha256 must be a 64-character hexadecimal digest'));
  assert.ok(violations.includes('Figma tokenValuesSha256 must match code token values'));
  assert.ok(violations.includes('Figma effectValuesSha256 must be a 64-character hexadecimal digest'));
  assert.ok(violations.includes('Figma effectValuesSha256 must match live effect readback'));
  assert.ok(violations.includes('Figma pageScreenshotSha256 must contain exactly all pages'));
  assert.ok(violations.includes('01 Principles screenshot SHA-256 must be a 64-character hexadecimal digest'));
  assert.ok(violations.includes('04.2 Badge screenshot SHA-256 is required'));
});

test('rejects duplicate Figma page screenshot digests', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pageScreenshotSha256['01 Principles'] = evidence.pageScreenshotSha256['00 Cover'];
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma page screenshot SHA-256 digests must be unique'));
});

test('rejects cross-file and duplicate normalized Figma node targets', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const evidenceFile = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'));
  evidence.components.Icon.componentUrls[0].url = figmaUrl('91-2');
  evidence.components.Icon.componentUrls[1].url = withQuery(figmaUrl('91:2'), 'source', 'duplicate');
  evidence.components.Badge.componentSetUrl = evidence.components.Badge.componentSetUrl
    .replace('/design/file?', '/design/other-file?');
  evidence.components.Button.componentSetUrl = evidence.components.Badge.componentSetUrl;
  await writeFile(evidenceFile, JSON.stringify(evidence));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.components[1].figmaUrl = evidence.components.Badge.componentSetUrl;
  manifest.components[2].figmaUrl = evidence.components.Button.componentSetUrl;
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.some((value) => value.includes('same Figma file')));
  assert.ok(violations.some((value) => value.includes('ten distinct manifest Figma node targets')));
  assert.ok(violations.some((value) => value.includes('fifteen distinct Figma node targets')));
});

test('rejects duplicate token-map collection, variable, and style IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'token-map.json');
  const tokenMap = JSON.parse(await readFile(file, 'utf8'));
  tokenMap.collections[1].id = tokenMap.collections[0].id;
  for (const variable of tokenMap.variables) {
    if (variable.collection === tokenMap.collections[1].name) {
      variable.collectionId = tokenMap.collections[1].id;
    }
  }
  tokenMap.variables[1].variableId = tokenMap.variables[0].variableId;
  tokenMap.styles.text[1].id = tokenMap.styles.text[0].id;
  tokenMap.styles.effect[1].styleId = tokenMap.styles.effect[0].styleId;
  await writeFile(file, JSON.stringify(tokenMap));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('token-map collection IDs must be unique'));
  assert.ok(violations.includes('token-map variable IDs must be unique'));
  assert.ok(violations.includes('token-map text style IDs must be unique'));
  assert.ok(violations.includes('token-map effect style IDs must be unique'));
});

test('rejects duplicate Figma page screenshot target IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pageScreenshotNodeIds['01 Principles'] = evidence.pageScreenshotNodeIds['00 Cover'];
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma page screenshot target IDs must be unique'));
});

test('rejects unexpected Figma component evidence keys', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.components.Tooltip = {};
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('Figma component keys must be exactly Icon, Badge, Button, TextField, ScrollArea, Checkbox, RadioGroup, Switch, Textarea, Select'));
});

test('rejects non-strict or impossible ISO timestamps', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.verifiedAt = '2026-02-30T03:00:00.000Z';
  evidence.foundations.approvedAt = '2026-07-10 02:00:00';
  await writeFile(file, JSON.stringify(evidence));
  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Figma verifiedAt must be a strict ISO timestamp'));
  assert.ok(violations.includes('Foundations approvedAt must be a strict ISO timestamp'));
});

test('rejects nonnumeric Figma component-set and master node IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const evidenceFile = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(evidenceFile, 'utf8'));
  evidence.components.Badge.componentSetUrl = figmaUrl('badge-set');
  evidence.components.Icon.componentUrls[0].url = figmaUrl('icon-master');
  await writeFile(evidenceFile, JSON.stringify(evidence));

  const manifestFile = path.join(root, 'apps', 'docs', 'dist', 'design-system', 'components.json');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.components[1].figmaUrl = evidence.components.Badge.componentSetUrl;
  await writeFile(manifestFile, JSON.stringify(manifest));

  const violations = await verifyFigmaEvidence(root);
  assert.ok(violations.includes('Badge Figma target URL is invalid'));
  assert.ok(violations.includes('Icon componentUrls must contain five exact icons'));
});

test('rejects nonnumeric Figma page screenshot node IDs', async (t) => {
  const root = await createFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'figma', 'verification.json');
  const evidence = JSON.parse(await readFile(file, 'utf8'));
  evidence.pageScreenshotNodeIds['00 Cover'] = 'page:1';
  await writeFile(file, JSON.stringify(evidence));
  assert.ok((await verifyFigmaEvidence(root))
    .includes('00 Cover screenshot node ID must match <number>:<number>'));
});

test('keeps permanent Linux and Windows verification CI', async () => {
  const workflow = await readFile(
    new URL('../../.github/workflows/verify.yml', import.meta.url),
    'utf8',
  );
  assert.match(workflow, /push:/);
  assert.match(workflow, /push:\s*\n\s+branches:\s*\[main\]/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /runs-on:\s*\$\{\{ matrix\.os \}\}/);
  assert.match(workflow, /pnpm\/action-setup@v4/);
  assert.match(workflow, /node-version-file:\s*\.node-version/);
  assert.match(workflow, /cache:\s*pnpm/);
  assert.match(workflow, /corepack pnpm install --frozen-lockfile/);
  assert.match(workflow, /playwright install(?: --with-deps)? chromium/);
  assert.match(workflow, /corepack pnpm verify/);
});
