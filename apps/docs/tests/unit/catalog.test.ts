import { describe, expect, it } from 'vitest';
import { NAVIGATION } from '../../src/navigation';
import {
  CANONICAL_HTML_ROUTES,
  COMPONENT_CATALOG_ROUTE,
  COMPONENT_HTML_ROUTES,
} from '../e2e/support/routes';

const componentNames = [
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
  'Dialog',
  'SearchField',
  'ListRow',
  'Toast',
  'BottomCTA',
];

describe('component catalog contract', () => {
  it('places one catalog entry before all twenty component detail links', () => {
    const componentSection = NAVIGATION.find(({ label }) => label === 'Components');

    expect(componentSection?.items).toEqual([
      { label: '전체 보기', href: '/components/' },
      ...componentNames.map((name, index) => ({
        label: name,
        href: COMPONENT_HTML_ROUTES[index]?.path,
      })),
    ]);
  });

  it('publishes the catalog within the exact thirty canonical routes', () => {
    expect(COMPONENT_CATALOG_ROUTE).toEqual({ path: '/components/', heading: 'Components' });
    expect(COMPONENT_HTML_ROUTES.map(({ heading }) => heading)).toEqual(componentNames);
    expect(CANONICAL_HTML_ROUTES).toHaveLength(30);
    expect(new Set(CANONICAL_HTML_ROUTES.map(({ path }) => path)).size).toBe(30);
  });
});
