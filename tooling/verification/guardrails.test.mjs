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
