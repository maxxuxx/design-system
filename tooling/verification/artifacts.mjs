import { createHash } from 'node:crypto';
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

function strictIsoTimestamp(value) {
  if (typeof value !== 'string') return false;
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/,
  );
  if (!match) return false;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, fraction = ''] = match;
  const [year, month, day, hour, minute, second] = [
    yearText, monthText, dayText, hourText, minuteText, secondText,
  ].map(Number);
  const millisecond = Number(fraction.padEnd(3, '0'));
  const local = new Date(0);
  local.setUTCFullYear(year, month - 1, day);
  local.setUTCHours(hour, minute, second, millisecond);
  if (local.getUTCFullYear() !== year
    || local.getUTCMonth() !== month - 1
    || local.getUTCDate() !== day
    || local.getUTCHours() !== hour
    || local.getUTCMinutes() !== minute
    || local.getUTCSeconds() !== second
    || local.getUTCMilliseconds() !== millisecond) return false;

  let offsetMinutes = 0;
  if (match[8] !== 'Z') {
    const offsetHour = Number(match[10]);
    const offsetMinute = Number(match[11]);
    if (offsetHour > 23 || offsetMinute > 59) return false;
    offsetMinutes = (offsetHour * 60 + offsetMinute) * (match[9] === '-' ? -1 : 1);
  }
  return Date.parse(value) === local.getTime() - offsetMinutes * 60_000;
}

function parseFigmaUrl(value, requireNode = false) {
  if (!nonEmpty(value)) return null;
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (parsed.origin !== 'https://www.figma.com'
      || segments[0] !== 'design'
      || !segments[1]) return null;
    const rawNodeId = parsed.searchParams.get('node-id');
    if (requireNode && !/^\d+[-:]\d+$/.test(rawNodeId ?? '')) return null;
    const nodeId = rawNodeId?.replace('-', ':') ?? null;
    return { fileKey: decodeURIComponent(segments[1]), nodeId };
  } catch {
    return null;
  }
}

function figmaNodeTarget(value) {
  const parsed = parseFigmaUrl(value, true);
  return parsed ? `${parsed.fileKey}\u0000${parsed.nodeId}` : null;
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

function expectedVariableType(token) {
  if (token.type === 'color') return 'COLOR';
  if (token.type === 'fontFamily') return 'STRING';
  return 'FLOAT';
}

export function computeTokenValuesSha256(tokens) {
  const canonical = tokens
    .filter(({ type }) => type !== 'shadow')
    .map(({ name, value, resolvedValue }) => ({
      tokenName: name,
      sourceValue: value,
      resolvedValue,
    }));
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
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
    const figmaTarget = figmaNodeTarget(component?.figmaUrl);
    if (!figmaTarget) violations.push(`${name} requires a Figma node URL`);
    else figmaUrls.push(figmaTarget);
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

async function validateComponentTokenCoverage(root, tokensArtifact, componentsArtifact) {
  const violations = [];
  const tokens = Array.isArray(tokensArtifact?.tokens) ? tokensArtifact.tokens : [];
  const tokenByName = new Map(tokens.map((token) => [token.name, token]));
  const tokenByCssVariable = new Map(tokens.map((token) => [token.cssVariable, token]));

  for (const { name, slug } of componentSpecs) {
    const relativeCss = `packages/react/src/${slug}/${name}.css`;
    let source;
    try {
      source = await readFile(path.join(root, ...relativeCss.split('/')), 'utf8');
    } catch {
      violations.push(`${name} CSS source is unreadable: ${relativeCss}`);
      continue;
    }

    const executableCss = source.replace(/\/\*[\s\S]*?\*\//g, '');
    const cssVariables = [...new Set(
      [...executableCss.matchAll(/var\(\s*(--ds-[A-Za-z0-9_-]+)\b/g)].map((match) => match[1]),
    )];
    const usedTokenNames = new Set();
    for (const cssVariable of cssVariables) {
      const token = tokenByCssVariable.get(cssVariable);
      if (!token) {
        violations.push(`${name} CSS references unknown token variable: ${cssVariable}`);
      } else {
        usedTokenNames.add(token.name);
      }
    }

    const component = componentsArtifact?.components?.find((entry) => entry?.name === name);
    if (!Array.isArray(component?.tokens)) continue;
    const declaredTokenNames = component.tokens.filter((tokenName) => typeof tokenName === 'string');
    const declaredTokenSet = new Set(declaredTokenNames);

    for (const tokenName of declaredTokenNames) {
      if (!tokenByName.has(tokenName)) {
        violations.push(`${name} manifest tokens include unknown token: ${tokenName}`);
      }
      if (declaredTokenNames.indexOf(tokenName) !== declaredTokenNames.lastIndexOf(tokenName)) {
        violations.push(`${name} manifest tokens contain duplicate token: ${tokenName}`);
      }
    }
    for (const tokenName of usedTokenNames) {
      if (!declaredTokenSet.has(tokenName)) {
        violations.push(`${name} manifest tokens omit CSS token: ${tokenName}`);
      }
    }
    for (const tokenName of declaredTokenSet) {
      if (tokenByName.has(tokenName) && !usedTokenNames.has(tokenName)) {
        violations.push(`${name} manifest tokens include unused CSS token: ${tokenName}`);
      }
    }
  }

  return [...new Set(violations)];
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
  const collections = tokenMap?.collections ?? [];
  const collectionByName = new Map();
  for (const collection of collections) {
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
  if (new Set(collections.map(({ id }) => id)).size !== collections.length) {
    violations.push('token-map collection IDs must be unique');
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
  if (new Set(variables.map(({ variableId }) => variableId)).size !== variables.length) {
    violations.push('token-map variable IDs must be unique');
  }
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
    if (variable.tokenType !== expectedVariableType(token)) violations.push(`${token.name} tokenType mismatch`);
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
  const textStyles = tokenMap?.styles?.text ?? [];
  if (new Set(textStyles.map(({ id }) => id)).size !== textStyles.length) {
    violations.push('token-map text style IDs must be unique');
  }
  const shadowTokens = tokens.filter(({ type }) => type === 'shadow');
  if (effects.length !== shadowTokens.length) violations.push('token-map effect style count mismatch');
  if (new Set(effects.map(({ styleId }) => styleId)).size !== effects.length) {
    violations.push('token-map effect style IDs must be unique');
  }
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
  violations.push(...await validateComponentTokenCoverage(root, tokens, manifest));
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
    'textStyleCount', 'effectStyleCount', 'pages', 'tokenValuesSha256',
    'pageScreenshotSha256', 'components', 'foundations',
    'pageScreenshotNodeIds', 'allPagesScreenshotReviewed', 'hardCodedProductValues',
  ])) violations.push('Figma evidence top-level fields mismatch');
  if (evidence.schemaVersion !== 1) violations.push('Figma schemaVersion must be 1');
  const figmaFile = parseFigmaUrl(evidence.fileUrl);
  if (!figmaFile) violations.push('Figma fileUrl is invalid');
  if (!strictIsoTimestamp(evidence.verifiedAt)) {
    violations.push('Figma verifiedAt must be a strict ISO timestamp');
  }
  if (evidence.codeConnect !== 'skipped-v0.1') violations.push('Code Connect must be skipped-v0.1');
  if (JSON.stringify(evidence.collections) !== JSON.stringify(collectionNames)) violations.push('Figma collection list mismatch');
  if (evidence.textStyleCount !== 8) violations.push('Figma textStyleCount must be 8');
  if (evidence.effectStyleCount !== 2) violations.push('Figma effectStyleCount must be 2');
  if (JSON.stringify(evidence.pages) !== JSON.stringify(pageNames)) violations.push('Figma page list mismatch');
  if (!/^[a-f0-9]{64}$/.test(evidence.tokenValuesSha256 ?? '')) {
    violations.push('Figma tokenValuesSha256 must be a 64-character hexadecimal digest');
  }
  if (evidence.tokenValuesSha256 !== computeTokenValuesSha256(tokensArtifact.tokens ?? [])) {
    violations.push('Figma tokenValuesSha256 must match code token values');
  }
  if (JSON.stringify(Object.keys(evidence.pageScreenshotSha256 ?? {}).sort())
    !== JSON.stringify([...pageNames].sort())) {
    violations.push('Figma pageScreenshotSha256 must contain exactly all pages');
  }
  for (const page of pageNames) {
    const screenshotSha256 = evidence.pageScreenshotSha256?.[page];
    if (!nonEmpty(screenshotSha256)) {
      violations.push(`${page} screenshot SHA-256 is required`);
    } else if (!/^[a-f0-9]{64}$/.test(screenshotSha256)) {
      violations.push(`${page} screenshot SHA-256 must be a 64-character hexadecimal digest`);
    }
  }
  if (!exactKeys(evidence.foundations, ['approved', 'approvedAt', 'tokenParity'])) {
    violations.push('Foundations evidence fields mismatch');
  }
  if (evidence.foundations?.approved !== true) {
    violations.push('Foundations approval evidence is incomplete');
  }
  if (!strictIsoTimestamp(evidence.foundations?.approvedAt)) {
    violations.push('Foundations approvedAt must be a strict ISO timestamp');
  }
  if (evidence.foundations?.tokenParity !== true) violations.push('Foundations token parity must be true');
  if (evidence.allPagesScreenshotReviewed !== true) violations.push('Every Figma page screenshot must be reviewed');
  if (JSON.stringify(Object.keys(evidence.pageScreenshotNodeIds ?? {}).sort())
    !== JSON.stringify([...pageNames].sort())) {
    violations.push('Figma screenshot node map must contain exactly all pages');
  }
  for (const page of pageNames) {
    const screenshotNodeId = evidence.pageScreenshotNodeIds?.[page];
    if (!nonEmpty(screenshotNodeId)) {
      violations.push(`${page} screenshot node ID is required`);
    } else if (!/^\d+:\d+$/.test(screenshotNodeId)) {
      violations.push(`${page} screenshot node ID must match <number>:<number>`);
    }
  }
  const screenshotTargetIds = pageNames.map((page) => evidence.pageScreenshotNodeIds?.[page]);
  if (new Set(screenshotTargetIds).size !== screenshotTargetIds.length) {
    violations.push('Figma page screenshot target IDs must be unique');
  }
  if (evidence.hardCodedProductValues !== 0) violations.push('Figma hard-coded product values must be 0');

  if (!exactKeys(evidence.components, componentSpecs.map(({ name }) => name))) {
    violations.push('Figma component keys must be exactly Icon, Badge, Button, TextField');
  }

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
    const parsedTarget = parseFigmaUrl(targetUrl, true);
    const target = figmaNodeTarget(targetUrl);
    if (!parsedTarget || !target) {
      violations.push(`${spec.name} Figma target URL is invalid`);
    } else {
      manifestTargets.push(target);
      if (figmaFile && parsedTarget.fileKey !== figmaFile.fileKey) {
        violations.push(`${spec.name} Figma target must use the same Figma file as fileUrl`);
      }
    }

    if (spec.name === 'Icon') {
      if (component.componentCount !== 5) violations.push('Icon componentCount must be 5');
      const iconUrls = component.componentUrls ?? [];
      const iconTargets = iconUrls.map(({ url }) => figmaNodeTarget(url));
      if (iconUrls.length !== 5
        || JSON.stringify(iconUrls.map(({ name }) => name)) !== JSON.stringify(iconNames)
        || iconUrls.some((entry) => !exactKeys(entry, ['name', 'url']))
        || iconTargets.some((value) => !value)
        || new Set(iconTargets).size !== 5) {
        violations.push('Icon componentUrls must contain five exact icons');
      }
      if (figmaFile && iconUrls.some(({ url }) => parseFigmaUrl(url, true)?.fileKey !== figmaFile.fileKey)) {
        violations.push('Icon component URLs must use the same Figma file as fileUrl');
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
    if (!target || figmaNodeTarget(manifestEntry?.figmaUrl) !== target) {
      violations.push(`${spec.name} manifest Figma URL must match readback evidence`);
    }
  }

  if (manifestTargets.length !== 4 || new Set(manifestTargets).size !== 4) {
    violations.push('Figma evidence must expose four distinct manifest Figma node targets');
  }
  const ownedIconTargets = evidence.components?.Icon?.componentUrls
    ?.map(({ url }) => figmaNodeTarget(url)) ?? [];
  const allEvidenceTargets = [...manifestTargets, ...ownedIconTargets];
  if (allEvidenceTargets.length !== 9
    || allEvidenceTargets.some((value) => !value)
    || new Set(allEvidenceTargets).size !== 9) {
    violations.push('Figma evidence must expose nine distinct Figma node targets');
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
