import { expect, test } from '@playwright/test';

test('tokens.json exposes the complete resolved token contract', async ({ request }) => {
  const response = await request.get('/design-system/tokens.json');
  expect(response.status()).toBe(200);
  const artifact = await response.json();
  expect(artifact.schemaVersion).toBe(1);
  expect(artifact.tokens).toHaveLength(118);
  expect(artifact.tokens.filter(({ kind }: { kind: string }) => kind === 'primitive')).toHaveLength(91);
  expect(artifact.tokens.filter(({ kind }: { kind: string }) => kind === 'semantic')).toHaveLength(27);
  for (const token of artifact.tokens) {
    expect(token).toEqual(expect.objectContaining({
      name: expect.any(String),
      type: expect.stringMatching(
        /^(color|dimension|duration|cubicBezier|fontFamily|fontWeight|shadow)$/,
      ),
      kind: expect.stringMatching(/^(primitive|semantic)$/),
      description: expect.any(String),
      cssVariable: expect.stringMatching(/^--ds-/),
    }));
    expect(['string', 'number']).toContain(typeof token.value);
    expect(['string', 'number']).toContain(typeof token.resolvedValue);
  }
});

test('components.json exposes all fifteen release-ready component contracts', async ({ request }) => {
  const response = await request.get('/design-system/components.json');
  expect(response.status()).toBe(200);
  const artifact = await response.json();
  expect(artifact.schemaVersion).toBe(1);
  expect(artifact.components.map(({ name }: { name: string }) => name))
    .toEqual([
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
  expect(artifact.components.map(({ docsUrl }: { docsUrl: string }) => docsUrl)).toEqual([
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
    '/components/text-button/',
    '/components/icon-button/',
    '/components/board-row/',
    '/components/tab/',
    '/components/bottom-sheet/',
  ]);
  const scrollArea = artifact.components.find(({ name }: { name: string }) => name === 'ScrollArea');
  expect(scrollArea.variants).toEqual([]);
  expect(scrollArea.sizes).toEqual([]);
  expect(scrollArea.states).toEqual(['no-overflow', 'start', 'middle', 'end']);
  expect(scrollArea.props.map(({
    name, type, required, defaultValue,
  }: {
    name: string;
    type: string;
    required: boolean;
    defaultValue: string | null;
  }) => ({ name, type, required, defaultValue }))).toEqual([
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
  ]);
  for (const component of artifact.components) {
    expect(component.status).toBe('preview');
    expect(component.frameworks).toEqual({
      react: 'preview',
      svelte: 'planned',
      reactNative: 'planned',
    });
    expect(component.figmaUrl).not.toBe('');
    expect(() => new URL(component.figmaUrl)).not.toThrow();
    expect(component.description).not.toBe('');
    expect(component.accessibility).not.toBe('');
    expect(Array.isArray(component.variants)).toBe(true);
    expect(Array.isArray(component.sizes)).toBe(true);
    expect(Array.isArray(component.states)).toBe(true);
    expect(Array.isArray(component.props)).toBe(true);
    expect(component.tokens.length).toBeGreaterThan(0);
  }
});
