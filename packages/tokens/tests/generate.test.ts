import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  renderCss,
  renderJson,
  resolveTokens,
} from '../src/generate.js';
import type { TokenDefinition } from '../src/types.js';

const primitiveUrl = new URL('../src/primitives.tokens.json', import.meta.url);
const semanticUrl = new URL('../src/semantic.tokens.json', import.meta.url);
const distCssUrl = new URL('../dist/tokens.css', import.meta.url);
const distJsonUrl = new URL('../dist/tokens.json', import.meta.url);
const docsJsonUrl = new URL(
  '../../../apps/docs/public/design-system/tokens.json',
  import.meta.url,
);
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const sourceRoots = [
  fileURLToPath(new URL('../../react/src/', import.meta.url)),
  fileURLToPath(new URL('../../../apps/docs/src/', import.meta.url)),
];
const sourceExtensions = new Set(['.astro', '.css', '.mdx', '.ts', '.tsx']);
const allowedFoundationSegments = [
  '/apps/docs/src/components/foundations/',
  '/apps/docs/src/content/foundations/',
];

async function loadDefinitions(): Promise<TokenDefinition[]> {
  const primitive = JSON.parse(
    await readFile(primitiveUrl, 'utf8'),
  ) as TokenDefinition[];
  const semantic = JSON.parse(
    await readFile(semanticUrl, 'utf8'),
  ) as TokenDefinition[];

  return [...primitive, ...semantic];
}

async function collectSourceFiles(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const files: string[] = [];
  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(path)));
    } else if (sourceExtensions.has(extname(entry.name))) {
      files.push(path);
    }
  }

  return files;
}

describe('token generation', () => {
  it('preserves source order and resolves aliases without losing them', async () => {
    const definitions = await loadDefinitions();
    const resolved = resolveTokens(definitions);

    expect(resolved).toHaveLength(105);
    expect(resolved.map((token) => token.name)).toEqual(
      definitions.map((token) => token.name),
    );
    expect(
      resolved.find((token) => token.name === 'color/action/primary'),
    ).toMatchObject({
      value: '{color/blue/600}',
      cssVariable: '--ds-color-action-primary',
      resolvedValue: '#245BE0',
    });
  });

  it('renders deterministic CSS units, aliases, and JSON fields', async () => {
    const definitions = await loadDefinitions();
    const first = resolveTokens(definitions);
    const second = resolveTokens(definitions);
    const css = renderCss(first);
    const json = renderJson(first);

    expect(renderCss(second)).toBe(css);
    expect(renderJson(second)).toBe(json);
    expect(css).toContain('  --ds-space-16: 16px;');
    expect(css).toContain('  --ds-font-weight-semibold: 600;');
    expect(css).toContain(
      '  --ds-color-action-primary: var(--ds-color-blue-600);',
    );
    expect(css).toContain(
      '  --ds-font-family-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;',
    );
    expect(css.endsWith('\n')).toBe(true);

    const parsed = JSON.parse(json) as {
      schemaVersion: number;
      tokens: Array<Record<string, unknown>>;
    };
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.tokens).toHaveLength(105);
    expect(Object.keys(parsed.tokens[0] ?? {})).toEqual([
      'name',
      'type',
      'kind',
      'value',
      'description',
      'cssVariable',
      'resolvedValue',
    ]);
    expect(json.endsWith('\n')).toBe(true);
  });

  it('uses committed CSS and JSON files as byte snapshots', async () => {
    const resolved = resolveTokens(await loadDefinitions());
    const [distCss, distJson, docsJson] = await Promise.all([
      readFile(distCssUrl, 'utf8'),
      readFile(distJsonUrl, 'utf8'),
      readFile(docsJsonUrl, 'utf8'),
    ]);

    expect(distCss).toBe(renderCss(resolved));
    expect(distJson).toBe(renderJson(resolved));
    expect(docsJson).toBe(distJson);
  });

  it('rejects primitive color CSS variables outside Foundation visualizers', async () => {
    const files = (
      await Promise.all(sourceRoots.map((root) => collectSourceFiles(root)))
    ).flat();
    const violations: string[] = [];

    for (const file of files) {
      const normalized = file.split(sep).join('/');
      if (
        allowedFoundationSegments.some((segment) =>
          normalized.includes(segment),
        )
      ) {
        continue;
      }

      const source = await readFile(file, 'utf8');
      for (const match of source.matchAll(
        /--ds-color-(?:neutral|blue|red|green)-/g,
      )) {
        const line = source.slice(0, match.index).split('\n').length;
        violations.push(
          `${relative(repoRoot, file).split(sep).join('/')}:${line}`,
        );
      }
    }

    expect(violations).toEqual([]);
  });
});
