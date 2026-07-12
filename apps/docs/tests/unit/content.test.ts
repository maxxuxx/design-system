import { readdir, readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';
import {
  COMPONENT_NAMES,
  COMPONENT_SLUGS,
  componentSchema,
} from '../../src/content/component-schema';
import {
  foundationSchema,
  guideSchema,
} from '../../src/content/page-schema';
import { NAVIGATION } from '../../src/navigation';
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
      'content/foundations/motion.mdx',
      'content/foundations/radius.mdx',
      'content/foundations/spacing.mdx',
      'content/foundations/typography.mdx',
      'content/components/icon.mdx',
      'content/components/badge.mdx',
      'content/components/button.mdx',
      'content/components/text-field.mdx',
      'content/components/scroll-area.mdx',
      'content/components/checkbox.mdx',
      'content/components/radio-group.mdx',
      'content/components/switch.mdx',
      'content/components/textarea.mdx',
      'content/components/select.mdx',
      'content/components/text-button.mdx',
      'content/components/icon-button.mdx',
      'content/components/board-row.mdx',
      'content/components/tab.mdx',
      'content/components/bottom-sheet.mdx',
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

  it('has both guides and all six Foundation documents', async () => {
    const files = (await listMdxFiles(srcRoot))
      .map((file) => relative(srcRoot, file).replaceAll('\\', '/'));
    expect(files).toEqual(expect.arrayContaining([
      'content/guides/getting-started.mdx',
      'content/guides/principles.mdx',
      'content/foundations/colors.mdx',
      'content/foundations/elevation.mdx',
      'content/foundations/motion.mdx',
      'content/foundations/radius.mdx',
      'content/foundations/spacing.mdx',
      'content/foundations/typography.mdx',
    ]));
  });

  it('locks the Motion foundation metadata and guidance contract', async () => {
    const source = await readFile(
      `${srcRoot}content/foundations/motion.mdx`,
      'utf8',
    );
    const parsed = matter(source);

    expect(foundationSchema.parse(parsed.data)).toEqual({
      slug: 'motion',
      title: '모션',
      description: '짧고 예측 가능한 전환으로 상태 변화와 공간 이동을 설명합니다.',
      order: 6,
      tokenPrefixes: ['motion/', 'color/bg/scrim'],
    });
    expect(parsed.content).toContain('motion/duration/fast');
    expect(parsed.content).toContain('motion/duration/medium');
    expect(parsed.content).toContain('motion/easing/standard');
    expect(parsed.content).toContain('prefers-reduced-motion');
    expect(parsed.content).toContain('color/bg/scrim');
  });

  it('links the Motion foundation route from navigation', () => {
    const foundations = NAVIGATION.find(
      (section) => section.label === 'Foundations',
    );

    expect(foundations?.items).toContainEqual({
      label: '모션',
      href: '/foundations/motion/',
    });
  });
});

describe('component metadata contract', () => {
  it('locks the fifteen component names and slugs in canonical order', () => {
    expect(COMPONENT_NAMES).toEqual([
      'Icon',
      'Badge',
      'Button',
      'TextField',
      'ScrollArea',
      'Checkbox',
      'RadioGroup',
      'Switch',
      'Textarea',
      'Select',
      'TextButton',
      'IconButton',
      'BoardRow',
      'Tab',
      'BottomSheet',
    ]);
    expect(COMPONENT_SLUGS).toEqual([
      'icon',
      'badge',
      'button',
      'text-field',
      'scroll-area',
      'checkbox',
      'radio-group',
      'switch',
      'textarea',
      'select',
      'text-button',
      'icon-button',
      'board-row',
      'tab',
      'bottom-sheet',
    ]);
  });

  it('locks the TextButton public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/text-button.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'TextButton',
      slug: 'text-button',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=182-121',
      variants: ['clear', 'underline', 'arrow'],
      sizes: ['small', 'medium', 'large'],
      states: [
        'default',
        'hover',
        'pressed',
        'focus-visible',
        'visited',
        'disabled',
      ],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
      { name: 'children', type: 'string', required: true, defaultValue: null },
      { name: 'href', type: 'string', required: false, defaultValue: null },
      { name: 'size', type: 'TextButtonSize', required: false, defaultValue: 'medium' },
      { name: 'variant', type: 'TextButtonVariant', required: false, defaultValue: 'clear' },
      { name: 'tone', type: 'TextButtonTone', required: false, defaultValue: 'primary' },
      {
        name: '...nativeProps',
        type: "Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'> | Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>",
        required: false,
        defaultValue: null,
      },
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'size/icon/small',
      'space/0',
      'space/2',
      'space/4',
      'space/8',
      'space/12',
      'space/16',
      'radius/sm',
      'font/family/sans',
      'font/size/caption',
      'font/size/body-sm',
      'font/size/body',
      'font/line-height/caption',
      'font/line-height/body-sm',
      'font/line-height/body',
      'font/weight/semibold',
      'motion/duration/fast',
      'motion/easing/standard',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/action/primary',
      'color/action/primary-hover',
      'color/action/primary-pressed',
      'color/action/weak',
      'color/action/weak-hover',
      'color/action/on-weak',
      'color/focus/ring',
    ]);
  });

  it('locks the IconButton public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/icon-button.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'IconButton',
      slug: 'icon-button',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=190-134',
      variants: ['clear', 'fill', 'outline'],
      sizes: ['small', 'medium', 'large'],
      states: [
        'default',
        'hover',
        'pressed',
        'focus-visible',
        'disabled',
      ],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
      { name: 'label', type: 'string', required: true, defaultValue: null },
      { name: 'name', type: 'IconName', required: true, defaultValue: null },
      { name: 'size', type: 'IconButtonSize', required: false, defaultValue: 'medium' },
      { name: 'variant', type: 'IconButtonVariant', required: false, defaultValue: 'clear' },
      {
        name: '...buttonProps',
        type: "Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'>",
        required: false,
        defaultValue: null,
      },
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'size/control/medium',
      'size/control/large',
      'size/icon/medium',
      'size/icon/large',
      'space/0',
      'space/2',
      'space/4',
      'radius/full',
      'font/family/sans',
      'motion/duration/fast',
      'motion/easing/standard',
      'color/bg/surface',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/disabled',
      'color/border/default',
      'color/border/focus',
      'color/border/strong',
      'color/action/primary',
      'color/action/primary-hover',
      'color/action/primary-pressed',
      'color/action/weak',
      'color/action/weak-hover',
      'color/action/on-primary',
      'color/action/on-weak',
      'color/focus/ring',
    ]);
  });

  it('locks the BoardRow public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/board-row.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'BoardRow',
      slug: 'board-row',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=197-38',
      variants: ['closed', 'open'],
      sizes: [],
      states: ['default', 'hover', 'pressed', 'focus-visible'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
      { name: 'title', type: 'string', required: true, defaultValue: null },
      { name: 'description', type: 'string', required: false, defaultValue: null },
      { name: 'prefix', type: 'ReactNode', required: false, defaultValue: null },
      { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
      { name: 'open', type: 'boolean', required: false, defaultValue: null },
      { name: 'defaultOpen', type: 'boolean', required: false, defaultValue: 'false' },
      {
        name: 'onOpenChange',
        type: '(open: boolean) => void',
        required: false,
        defaultValue: null,
      },
      {
        name: '...detailsProps',
        type: "Omit<DetailsHTMLAttributes<HTMLDetailsElement>, 'children' | 'onToggle' | 'open' | 'prefix'>",
        required: false,
        defaultValue: null,
      },
    ]);
    expect(data.tokens).toEqual([
      'size/control/large',
      'size/icon/medium',
      'space/0',
      'space/2',
      'space/4',
      'space/8',
      'space/12',
      'space/16',
      'radius/none',
      'radius/md',
      'font/family/sans',
      'font/size/body-sm',
      'font/size/body',
      'font/weight/semibold',
      'font/line-height/body-sm',
      'font/line-height/body',
      'motion/duration/fast',
      'motion/easing/standard',
      'color/bg/surface',
      'color/text/primary',
      'color/text/secondary',
      'color/border/default',
      'color/action/weak',
      'color/action/weak-hover',
      'color/focus/ring',
    ]);
  });

  it('locks the Tab public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/tab.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'Tab',
      slug: 'tab',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=202-59',
      variants: ['equal', 'scroll'],
      sizes: ['small', 'large'],
      states: [
        'default',
        'hover',
        'pressed',
        'focus-visible',
        'selected',
        'disabled',
      ],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
      { name: 'ariaLabel', type: 'string', required: true, defaultValue: null },
      { name: 'items', type: 'readonly TabItem[]', required: true, defaultValue: null },
      { name: 'value', type: 'string', required: false, defaultValue: null },
      { name: 'defaultValue', type: 'string', required: false, defaultValue: 'first enabled' },
      {
        name: 'onValueChange',
        type: '(value: string) => void',
        required: false,
        defaultValue: null,
      },
      { name: 'size', type: 'TabSize', required: false, defaultValue: 'large' },
      { name: 'layout', type: 'TabLayout', required: false, defaultValue: 'equal' },
      {
        name: '...divProps',
        type: "Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'>",
        required: false,
        defaultValue: null,
      },
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'space/0',
      'space/2',
      'space/8',
      'space/16',
      'space/24',
      'radius/none',
      'radius/sm',
      'font/family/sans',
      'font/size/body-sm',
      'font/size/body',
      'font/weight/semibold',
      'font/line-height/body-sm',
      'font/line-height/body',
      'motion/duration/fast',
      'motion/easing/standard',
      'color/bg/surface',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/border/default',
      'color/action/primary',
      'color/action/weak',
      'color/action/weak-hover',
      'color/action/on-weak',
      'color/focus/ring',
    ]);
  });

  it('locks the BottomSheet public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/bottom-sheet.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'BottomSheet',
      slug: 'bottom-sheet',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=209-66',
      variants: ['content', 'full'],
      sizes: [],
      states: ['open', 'closing'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
      { name: 'open', type: 'boolean', required: true, defaultValue: null },
      {
        name: 'onOpenChange',
        type: '(open: boolean, reason: BottomSheetCloseReason) => void',
        required: true,
        defaultValue: null,
      },
      { name: 'title', type: 'string', required: true, defaultValue: null },
      { name: 'description', type: 'string', required: false, defaultValue: null },
      { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
      { name: 'footer', type: 'ReactNode', required: false, defaultValue: null },
      { name: 'closeLabel', type: 'string', required: true, defaultValue: null },
      { name: 'dismissible', type: 'boolean', required: false, defaultValue: 'true' },
      {
        name: 'portalContainer',
        type: 'HTMLElement | null',
        required: false,
        defaultValue: 'document.body after hydration',
      },
      {
        name: 'initialFocusRef',
        type: 'RefObject<HTMLElement | null>',
        required: false,
        defaultValue: 'owned close button',
      },
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'size/icon/medium',
      'space/0',
      'space/2',
      'space/4',
      'space/8',
      'space/12',
      'space/16',
      'space/24',
      'space/64',
      'radius/xl',
      'font/family/sans',
      'font/size/body-sm',
      'font/size/body',
      'font/size/title-sm',
      'font/weight/semibold',
      'font/line-height/body-sm',
      'font/line-height/body',
      'font/line-height/title-sm',
      'elevation/2',
      'motion/duration/fast',
      'motion/duration/medium',
      'motion/easing/standard',
      'color/bg/scrim',
      'color/bg/surface',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/border/default',
      'color/border/focus',
      'color/border/strong',
      'color/action/primary',
      'color/action/primary-hover',
      'color/action/primary-pressed',
      'color/action/weak',
      'color/action/weak-hover',
      'color/action/on-primary',
      'color/action/on-weak',
      'color/focus/ring',
    ]);
  });

  it('locks the Select public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/select.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'Select',
      slug: 'select',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=168-72',
      variants: [],
      sizes: ['medium', 'large'],
      states: ['default', 'focus', 'error', 'disabled'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
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
    ]);
    expect(data.tokens).toEqual([
      'size/control/medium',
      'size/control/large',
      'size/icon/medium',
      'space/2',
      'space/4',
      'space/8',
      'space/16',
      'space/20',
      'radius/md',
      'font/family/sans',
      'font/size/body-sm',
      'font/size/body',
      'font/size/caption',
      'font/line-height/body-sm',
      'font/line-height/body',
      'font/line-height/caption',
      'font/weight/semibold',
      'color/bg/surface',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/border/default',
      'color/border/focus',
      'color/icon/primary',
      'color/status/danger',
      'color/status/danger-subtle',
      'color/focus/ring',
    ]);
  });

  it('locks the Textarea public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/textarea.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'Textarea',
      slug: 'textarea',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=158-56',
      variants: ['vertical', 'none'],
      sizes: ['medium', 'large'],
      states: ['default', 'focus', 'error', 'disabled'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
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
    ]);
    expect(data.tokens).toEqual([
      'size/control/medium',
      'size/control/large',
      'space/2',
      'space/4',
      'space/8',
      'space/12',
      'space/16',
      'space/20',
      'radius/md',
      'font/family/sans',
      'font/size/body-sm',
      'font/size/body',
      'font/size/caption',
      'font/line-height/body-sm',
      'font/line-height/body',
      'font/line-height/caption',
      'font/weight/semibold',
      'color/bg/surface',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/border/default',
      'color/border/focus',
      'color/status/danger',
      'color/status/danger-subtle',
      'color/focus/ring',
    ]);
  });

  it('locks the Switch public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/switch.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'Switch',
      slug: 'switch',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=153-122',
      variants: ['off', 'on'],
      sizes: ['small', 'medium'],
      states: ['default', 'error', 'disabled'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
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
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'size/switch/small-width',
      'size/switch/small-height',
      'size/switch/medium-width',
      'size/switch/medium-height',
      'space/2',
      'space/4',
      'space/8',
      'radius/full',
      'elevation/1',
      'font/family/sans',
      'font/size/caption',
      'font/size/body-sm',
      'font/size/body',
      'font/line-height/caption',
      'font/line-height/body-sm',
      'font/line-height/body',
      'color/bg/surface',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/border/default',
      'color/border/focus',
      'color/action/primary',
      'color/action/primary-hover',
      'color/action/primary-pressed',
      'color/action/on-primary',
      'color/status/danger',
      'color/status/on-status',
      'color/focus/ring',
    ]);
  });

  it('locks the RadioGroup public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/radio-group.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'RadioGroup',
      slug: 'radio-group',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=147-272',
      variants: ['none', 'first', 'second'],
      sizes: ['small', 'medium'],
      states: ['default', 'error', 'disabled'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
      { name: 'legend', type: 'string', required: true, defaultValue: null },
      { name: 'name', type: 'string', required: true, defaultValue: null },
      { name: 'options', type: 'readonly RadioGroupOption[]', required: true, defaultValue: null },
      { name: 'description', type: 'string', required: false, defaultValue: null },
      { name: 'errorMessage', type: 'string', required: false, defaultValue: null },
      { name: 'size', type: 'RadioGroupSize', required: false, defaultValue: 'medium' },
      { name: 'value', type: 'string', required: false, defaultValue: null },
      { name: 'defaultValue', type: 'string', required: false, defaultValue: null },
      { name: 'required', type: 'boolean', required: false, defaultValue: 'false' },
      { name: 'onChange', type: 'ChangeEventHandler<HTMLInputElement>', required: false, defaultValue: null },
      {
        name: '...fieldsetProps',
        type: "Omit<FieldsetHTMLAttributes<HTMLFieldSetElement>, 'children' | 'onChange'>",
        required: false,
        defaultValue: null,
      },
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'size/selection/small',
      'size/selection/medium',
      'space/2',
      'space/4',
      'space/8',
      'radius/full',
      'font/family/sans',
      'font/weight/semibold',
      'font/size/caption',
      'font/size/body-sm',
      'font/size/body',
      'font/line-height/caption',
      'font/line-height/body-sm',
      'font/line-height/body',
      'color/bg/surface',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/border/default',
      'color/border/focus',
      'color/action/primary',
      'color/action/primary-hover',
      'color/action/primary-pressed',
      'color/action/on-primary',
      'color/status/danger',
      'color/status/on-status',
      'color/focus/ring',
    ]);
  });

  it('locks the Checkbox public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/checkbox.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'Checkbox',
      slug: 'checkbox',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=139-176',
      variants: ['unchecked', 'checked', 'indeterminate'],
      sizes: ['small', 'medium'],
      states: ['default', 'error', 'disabled'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
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
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'size/selection/small',
      'size/selection/medium',
      'space/2',
      'space/4',
      'space/8',
      'radius/sm',
      'font/family/sans',
      'font/size/caption',
      'font/size/body-sm',
      'font/size/body',
      'font/line-height/caption',
      'font/line-height/body-sm',
      'font/line-height/body',
      'color/bg/surface',
      'color/bg/subtle',
      'color/text/primary',
      'color/text/secondary',
      'color/text/disabled',
      'color/border/default',
      'color/border/focus',
      'color/action/primary',
      'color/action/primary-hover',
      'color/action/primary-pressed',
      'color/action/on-primary',
      'color/status/danger',
      'color/status/on-status',
      'color/focus/ring',
    ]);
  });

  it('locks the ScrollArea public metadata contract', async () => {
    const source = await readFile(
      `${srcRoot}content/components/scroll-area.mdx`,
      'utf8',
    );
    const data = componentSchema.parse(matter(source).data);

    expect(data).toMatchObject({
      name: 'ScrollArea',
      slug: 'scroll-area',
      figmaUrl: 'https://www.figma.com/design/hNlju4j556mzi0G515UDwE?node-id=115-6',
      variants: [],
      sizes: [],
      states: ['no-overflow', 'start', 'middle', 'end'],
    });
    expect(data.props.map(({ name, type, required, defaultValue }) => ({
      name,
      type,
      required,
      defaultValue,
    }))).toEqual([
      { name: 'children', type: 'ReactNode', required: true, defaultValue: null },
      { name: 'label', type: 'string', required: true, defaultValue: null },
      { name: 'scrollUpLabel', type: 'string', required: true, defaultValue: null },
      { name: 'scrollDownLabel', type: 'string', required: true, defaultValue: null },
      {
        name: 'viewportRef',
        type: 'Ref<HTMLDivElement>',
        required: false,
        defaultValue: null,
      },
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
    ]);
    expect(data.tokens).toEqual([
      'size/control/small',
      'space/2',
      'space/4',
      'space/8',
      'space/64',
      'radius/full',
      'elevation/1',
      'blur/subtle',
      'color/bg/surface',
      'color/action/weak',
      'color/action/weak-hover',
      'color/action/on-weak',
      'color/border/default',
      'color/border/focus',
      'color/focus/ring',
    ]);
  });

  it('keeps stable ScrollArea demo test IDs for every rendered part', async () => {
    const source = await readFile(
      `${srcRoot}components/examples/ScrollAreaExample.tsx`,
      'utf8',
    );

    for (const testId of [
      'scroll-area-viewport',
      'scroll-area-content',
      'scroll-area-edge-up',
      'scroll-area-edge-down',
      'scroll-area-button-up',
      'scroll-area-button-down',
    ]) {
      expect(source).toContain(`'${testId}'`);
    }
    expect(source).toContain('viewportRef={viewportRef}');
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
