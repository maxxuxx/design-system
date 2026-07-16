import { describe, expect, it } from 'vitest';

import { mergeIds } from './ids';

describe('mergeIds', () => {
  it('merges whitespace separated IDs once in input order', () => {
    expect(mergeIds('description error', 'error external external')).toBe(
      'description error external',
    );
    expect(mergeIds(undefined, '  ')).toBeUndefined();
  });
});
