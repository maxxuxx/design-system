import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  findBrandViolations,
  findComponentSliceContractViolations,
  findPrimitiveColorReferences,
  findWorkspaceViolations,
} from './guardrails.mjs';

const componentSlicesSource = `const slices = [
  { name: 'Icon', slug: 'icon' },
  { name: 'Badge', slug: 'badge' },
  { name: 'Button', slug: 'button' },
  { name: 'TextField', slug: 'text-field' },
  { name: 'ScrollArea', slug: 'scroll-area' },
  { name: 'Checkbox', slug: 'checkbox' },
  { name: 'RadioGroup', slug: 'radio-group' },
  { name: 'Switch', slug: 'switch' },
  { name: 'Textarea', slug: 'textarea' },
  { name: 'Select', slug: 'select' },
  { name: 'TextButton', slug: 'text-button' },
  { name: 'IconButton', slug: 'icon-button' },
  { name: 'BoardRow', slug: 'board-row' },
  { name: 'Tab', slug: 'tab' },
  { name: 'BottomSheet', slug: 'bottom-sheet' },
  { name: 'Dialog', slug: 'dialog' },
  { name: 'SearchField', slug: 'search-field' },
  { name: 'ListRow', slug: 'list-row' },
  { name: 'Toast', slug: 'toast' },
  { name: 'BottomCTA', slug: 'bottom-cta' },
] as const;
`;

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'ds-guardrail-'));
  await mkdir(path.join(root, 'apps', 'docs'), { recursive: true });
  await mkdir(path.join(root, 'apps', 'docs', 'src'), { recursive: true });
  await mkdir(path.join(root, 'packages', 'tokens'), { recursive: true });
  await mkdir(path.join(root, 'packages', 'react', 'src'), { recursive: true });
  const packages = new Map([
    ['apps/docs', '@hds/docs'],
    ['packages/tokens', '@hds/tokens'],
    ['packages/react', '@hds/react'],
  ]);
  for (const [relative, name] of packages) {
    await writeFile(
      path.join(root, relative, 'package.json'),
      JSON.stringify({ name, private: true, version: '0.1.0' }),
    );
  }
  await writeFile(
    path.join(root, 'package.json'),
    JSON.stringify({ name: '@hds/workspace', private: true, version: '0.1.0' }),
  );
  await writeFile(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - apps/*\n  - packages/*\n');
  return root;
}

test('accepts only the three private workspaces', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.deepEqual(await findWorkspaceViolations(root), []);
});

test('rejects an extra workspace and a public package', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'packages', 'svelte'), { recursive: true });
  await writeFile(path.join(root, 'packages', 'svelte', 'package.json'), JSON.stringify({ private: false }));
  const violations = await findWorkspaceViolations(root);
  assert.ok(violations.some((value) => value.includes('packages/svelte')));
  assert.ok(violations.some((value) => value.includes('private')));
});

test('rejects package name and version drift from the HDS v0.1.0 graph', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(
    path.join(root, 'packages', 'react', 'package.json'),
    JSON.stringify({ name: '@hds/react-next', private: true, version: '0.2.0' }),
  );

  const violations = await findWorkspaceViolations(root);
  assert.ok(violations.includes('Workspace package name must be @hds/react: packages/react'));
  assert.ok(violations.includes('Workspace version must be 0.1.0: packages/react'));
});

test('rejects a missing required workspace', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await rm(path.join(root, 'packages', 'react'), { recursive: true, force: true });
  const violations = await findWorkspaceViolations(root);
  assert.ok(violations.some((value) => value.includes('Missing workspace: packages/react')));
});

test('rejects workspace declarations and packages outside the expected graph', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'extras', 'preview'), { recursive: true });
  await writeFile(path.join(root, 'extras', 'preview', 'package.json'), JSON.stringify({ private: true }));
  await writeFile(
    path.join(root, 'pnpm-workspace.yaml'),
    'packages:\n  - apps/*\n  - packages/*\n  - extras/*\n',
  );
  const violations = await findWorkspaceViolations(root);
  assert.ok(violations.includes('Unexpected workspace declaration: extras/*'));
  assert.ok(violations.includes('Unexpected workspace: extras/preview'));
});

test('ignores non-package child directories matched by workspace globs', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'packages', 'examples'), { recursive: true });
  assert.deepEqual(await findWorkspaceViolations(root), []);
});

test('finds primitive colors in product code but ignores foundation visualizers', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, 'packages', 'react', 'src', 'button.css'), 'color: var(--hds-color-blue-600);');
  const allowed = path.join(root, 'apps', 'docs', 'src', 'components', 'foundations');
  await mkdir(allowed, { recursive: true });
  await writeFile(path.join(allowed, 'ColorGrid.astro'), '--hds-color-blue-600');
  const allowedContent = path.join(root, 'apps', 'docs', 'src', 'content', 'foundations');
  await mkdir(allowedContent, { recursive: true });
  await writeFile(path.join(allowedContent, 'colors.mdx'), '`--hds-color-blue-600`');
  const violations = await findPrimitiveColorReferences(root);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /button\.css/);
});

test('accepts the clean HDS namespace and ignores historical superpowers records', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const historical = path.join(root, 'docs', 'superpowers');
  await mkdir(historical, { recursive: true });
  await writeFile(
    path.join(historical, 'history.md'),
    'AI-Readable @maxxuxx/react --ds-color-action-primary .ds-button ds-text-field-old',
  );
  await writeFile(
    path.join(root, 'apps', 'docs', 'src', 'reference.ts'),
    "export const reference = 'https://tossmini-docs.toss.im/tds-mobile/components/badge/';",
  );

  assert.deepEqual(await findBrandViolations(root), []);
});

test('rejects every retired brand namespace in current source and Figma evidence', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const figma = path.join(root, 'figma');
  await mkdir(figma, { recursive: true });
  await writeFile(
    path.join(root, 'apps', 'docs', 'src', 'legacy.ts'),
    [
      'AI-Readable Design System',
      '@maxxuxx/react',
      'var(--ds-color-action-primary)',
      '.ds-button',
      'ds-text-field-generated',
    ].join('\n'),
  );
  await writeFile(path.join(figma, 'token-map.json'), '{"syntax":"var(--ds-space-8)"}');

  const violations = await findBrandViolations(root);
  assert.ok(violations.some((value) => value.includes('AI-Readable')));
  assert.ok(violations.some((value) => value.includes('@maxxuxx')));
  assert.ok(violations.some((value) => value.includes('--ds-')));
  assert.ok(violations.some((value) => value.includes('.ds-')));
  assert.ok(violations.some((value) => value.includes('retired automatic ID')));
  assert.ok(violations.some((value) => value.includes('figma/token-map.json')));
});

test('accepts the exact twenty component slices and forty Windows targets', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = path.join(root, 'apps', 'docs', 'tests', 'e2e');
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'component-slices.visual.spec.ts'), componentSlicesSource);

  assert.deepEqual(await findComponentSliceContractViolations(root), []);
});

test('rejects missing, extra, or reordered component-slice targets', async (t) => {
  const root = await fixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = path.join(root, 'apps', 'docs', 'tests', 'e2e');
  const target = path.join(directory, 'component-slices.visual.spec.ts');
  await mkdir(directory, { recursive: true });

  await writeFile(target, componentSlicesSource.replace(
    "  { name: 'BottomCTA', slug: 'bottom-cta' },\n",
    '',
  ));
  assert.deepEqual(await findComponentSliceContractViolations(root), [
    'Component slice list must contain exactly 20 ordered components and 40 Windows mobile/desktop targets',
  ]);

  await writeFile(target, componentSlicesSource.replace(
    "  { name: 'Toast', slug: 'toast' },\n  { name: 'BottomCTA', slug: 'bottom-cta' },",
    "  { name: 'BottomCTA', slug: 'bottom-cta' },\n  { name: 'Toast', slug: 'toast' },",
  ));
  assert.deepEqual(await findComponentSliceContractViolations(root), [
    'Component slice list must contain exactly 20 ordered components and 40 Windows mobile/desktop targets',
  ]);
});
