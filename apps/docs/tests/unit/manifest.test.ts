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
    ScrollArea: 'scroll-area',
    Checkbox: 'checkbox',
    RadioGroup: 'radio-group',
    Switch: 'switch',
    Textarea: 'textarea',
    Select: 'select',
    TextButton: 'text-button',
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

  it('sorts all ten entries in canonical order regardless of file order', () => {
    const manifest = buildComponentManifest([
      document('Select'),
      document('Textarea'),
      document('Switch'),
      document('RadioGroup'),
      document('Checkbox'),
      document('ScrollArea'),
      document('TextField'),
      document('Button'),
      document('Badge'),
      document('Icon'),
    ]);
    expect(manifest.components.map(({ name }) => name))
      .toEqual(['Icon', 'Badge', 'Button', 'TextField', 'ScrollArea', 'Checkbox', 'RadioGroup', 'Switch', 'Textarea', 'Select']);
    expect(manifest.components.map(({ docsUrl }) => docsUrl)).toEqual([
      '/components/icon/',
      '/components/badge/',
      '/components/button/',
      '/components/text-field/',
      '/components/scroll-area/',
      '/components/checkbox/',
      '/components/radio-group/',
      '/components/switch/',
      '/components/textarea/',
      '/components/select/',
    ]);
  });

  it('requires all entries before the release check can pass', () => {
    expect(() => buildComponentManifest([document('Icon')], { requireFigma: true }))
      .toThrow('Release manifest is missing components: Badge, Button, TextField, ScrollArea, Checkbox, RadioGroup, Switch, Textarea, Select');
  });

  it('requires a Figma URL on every complete release entry', () => {
    const documents = ['Icon', 'Badge', 'Button', 'TextField', 'ScrollArea', 'Checkbox', 'RadioGroup', 'Switch', 'Textarea', 'Select', 'TextButton']
      .map((name) => document(name as ComponentMetadata['name']));
    expect(() => buildComponentManifest(documents, { requireFigma: true }))
      .toThrow('Figma URLs are required for release: Icon, Badge, Button, TextField, ScrollArea, Checkbox, RadioGroup, Switch, Textarea, Select, TextButton');
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
