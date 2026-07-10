import { readdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_NAMES,
  componentSchema,
} from '../../src/content/component-schema';
import {
  foundationSchema,
  guideSchema,
} from '../../src/content/page-schema';
import {
  REQUIRED_COMPONENT_HEADINGS,
  extractSecondLevelHeadings,
  validateComponentTemplate,
} from '../../scripts/validate-component-template';

const srcRoot = fileURLToPath(new URL('../../src/', import.meta.url));

async function listMdxFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return listMdxFiles(path);
    return entry.isFile() && entry.name.endsWith('.mdx') ? [path] : [];
  }));
  return nested.flat().sort();
}

function validComponent() {
  return {
    name: 'Button',
    slug: 'button',
    description: '주요 행동을 실행합니다.',
    status: 'preview',
    figmaUrl: '',
    frameworks: {
      react: 'preview',
      svelte: 'planned',
      reactNative: 'planned',
    },
    variants: ['fill', 'weak', 'outline'],
    sizes: ['small', 'medium', 'large'],
    states: ['default', 'pressed', 'disabled', 'loading'],
    accessibility: '기본 button 의미와 키보드 동작을 유지합니다.',
    props: [{
      name: 'size',
      type: "'small' | 'medium' | 'large'",
      required: false,
      defaultValue: 'medium',
      description: '버튼 높이를 정합니다.',
    }],
    tokens: ['color/action/primary'],
  };
}

describe('MDX collection coverage', () => {
  it('keeps every MDX file inside a validated collection and validates it', async () => {
    const files = await listMdxFiles(srcRoot);
    const allowedFiles = new Set([
      'content/guides/getting-started.mdx',
      'content/guides/principles.mdx',
      'content/foundations/colors.mdx',
      'content/foundations/elevation.mdx',
      'content/foundations/radius.mdx',
      'content/foundations/spacing.mdx',
      'content/foundations/typography.mdx',
      'content/components/icon.mdx',
      'content/components/badge.mdx',
      'content/components/button.mdx',
      'content/components/text-field.mdx',
    ]);

    for (const file of files) {
      const normalized = relative(srcRoot, file).replaceAll('\\', '/');
      expect(allowedFiles.has(normalized), `${normalized} is not collection-backed`).toBe(true);
      const source = await readFile(file, 'utf8');
      const parsed = matter(source);
      if (normalized.startsWith('content/guides/')) guideSchema.parse(parsed.data);
      if (normalized.startsWith('content/foundations/')) foundationSchema.parse(parsed.data);
      if (normalized.startsWith('content/components/')) {
        componentSchema.parse(parsed.data);
        validateComponentTemplate(parsed.content, file);
      }
    }
  });

  it('has both guides and all five Foundation documents', async () => {
    const files = (await listMdxFiles(srcRoot))
      .map((file) => relative(srcRoot, file).replaceAll('\\', '/'));
    expect(files).toEqual(expect.arrayContaining([
      'content/guides/getting-started.mdx',
      'content/guides/principles.mdx',
      'content/foundations/colors.mdx',
      'content/foundations/elevation.mdx',
      'content/foundations/radius.mdx',
      'content/foundations/spacing.mdx',
      'content/foundations/typography.mdx',
    ]));
  });
});

describe('component metadata contract', () => {
  it('locks the four component names', () => {
    expect(COMPONENT_NAMES).toEqual(['Icon', 'Badge', 'Button', 'TextField']);
  });

  it('rejects a preview component whose React state is stable', () => {
    const value = validComponent();
    value.frameworks.react = 'stable';
    const result = componentSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['frameworks', 'react']);
  });

  it('rejects stable component status because v0.1 is preview-only', () => {
    const value = validComponent();
    value.status = 'stable';
    const result = componentSchema.safeParse(value);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['status']);
  });

  it('rejects a wrong name and slug pair', () => {
    const value = validComponent();
    value.slug = 'badge';
    expect(() => componentSchema.parse(value)).toThrow('Button must use slug button');
  });
});

describe('component heading contract', () => {
  it('ignores H2-looking lines inside fenced code and JSX', () => {
    const source = [
      '```md',
      '## 코드 안 제목',
      '```',
      '<ComponentPreview>',
      '## JSX 안 제목',
      '</ComponentPreview>',
      ...REQUIRED_COMPONENT_HEADINGS.map((heading) => `## ${heading}`),
    ].join('\n');
    expect(extractSecondLevelHeadings(source)).toEqual(REQUIRED_COMPONENT_HEADINGS);
  });

  it('reports the exact first heading-order mismatch', () => {
    const headings = [...REQUIRED_COMPONENT_HEADINGS];
    [headings[0], headings[1]] = [headings[1]!, headings[0]!];
    expect(() => validateComponentTemplate(
      headings.map((heading) => `## ${heading}`).join('\n'),
      'button.mdx',
    )).toThrow('button.mdx: component heading 1 expected "예제" but found "사용해야 할 때".');
  });

  it('reports a missing final heading', () => {
    const source = REQUIRED_COMPONENT_HEADINGS
      .slice(0, -1)
      .map((heading) => `## ${heading}`)
      .join('\n');
    expect(() => validateComponentTemplate(source, 'button.mdx'))
      .toThrow('button.mdx: component heading 13 expected "지원 상태" but found "<missing>".');
  });
});
