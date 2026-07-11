import { expect, test } from '@playwright/test';

test('tokens.json exposes the complete resolved token contract', async ({ request }) => {
  const response = await request.get('/design-system/tokens.json');
  expect(response.status()).toBe(200);
  const artifact = await response.json();
  expect(artifact.schemaVersion).toBe(1);
  expect(artifact.tokens).toHaveLength(106);
  for (const token of artifact.tokens) {
    expect(token).toEqual(expect.objectContaining({
      name: expect.any(String),
      type: expect.stringMatching(/^(color|dimension|fontFamily|fontWeight|shadow)$/),
      kind: expect.stringMatching(/^(primitive|semantic)$/),
      description: expect.any(String),
      cssVariable: expect.stringMatching(/^--ds-/),
    }));
    expect(['string', 'number']).toContain(typeof token.value);
    expect(['string', 'number']).toContain(typeof token.resolvedValue);
  }
});

test('components.json exposes all four release-ready component contracts', async ({ request }) => {
  const response = await request.get('/design-system/components.json');
  expect(response.status()).toBe(200);
  const artifact = await response.json();
  expect(artifact.schemaVersion).toBe(1);
  expect(artifact.components.map(({ name }: { name: string }) => name))
    .toEqual(['Icon', 'Badge', 'Button', 'TextField']);
  expect(artifact.components.map(({ docsUrl }: { docsUrl: string }) => docsUrl)).toEqual([
    '/components/icon/',
    '/components/badge/',
    '/components/button/',
    '/components/text-field/',
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
