import { describe, expect, it } from 'vitest';

import type { TokenDefinition, TokenType } from '../src/types.js';
import { validateTokens } from '../src/validate.js';

function token(
  name: string,
  type: TokenType,
  kind: TokenDefinition['kind'],
  value: string | number,
  description = '寃利??숈옉???뺤씤?섎뒗 ?뚯뒪???좏겙?낅땲??',
): TokenDefinition {
  return { name, type, kind, value, description };
}

describe('validateTokens', () => {
  it('accepts a valid primitive and semantic alias pair', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
      token(
        'color/action/primary',
        'color',
        'semantic',
        '{color/blue/600}',
      ),
    ];

    const result = validateTokens(tokens);

    expect([...result.keys()]).toEqual([
      'color/blue/600',
      'color/action/primary',
    ]);
  });

  it('rejects duplicate names', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Duplicate token name: color/blue/600',
    );
  });

  it('rejects an alias whose target does not exist', () => {
    const tokens = [
      token(
        'color/action/primary',
        'color',
        'semantic',
        '{color/blue/600}',
      ),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Unknown alias target "color/blue/600" referenced by "color/action/primary".',
    );
  });

  it('rejects aliases that change token type', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0'),
      token('space/action', 'dimension', 'semantic', '{color/blue/600}'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Alias type mismatch: "space/action" (dimension) references "color/blue/600" (color).',
    );
  });

  it('rejects a raw semantic color', () => {
    const tokens = [
      token('color/action/primary', 'color', 'semantic', '#245BE0'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Semantic color token "color/action/primary" must use an alias.',
    );
  });

  it('rejects an alias cycle with the full path', () => {
    const tokens = [
      token('a', 'color', 'semantic', '{b}'),
      token('b', 'color', 'semantic', '{a}'),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Alias cycle: a -> b -> a',
    );
  });

  it('rejects an empty description', () => {
    const tokens = [
      token('color/blue/600', 'color', 'primitive', '#245BE0', '   '),
    ];

    expect(() => validateTokens(tokens)).toThrow();
  });
});
