import { describe, expect, it } from 'vitest';

import type { TokenDefinition, TokenType } from '../src/types.js';
import { validateTokens } from '../src/validate.js';

function token(
  name: string,
  type: TokenType,
  kind: TokenDefinition['kind'],
  value: string | number,
  description = '검증 동작을 확인하는 테스트 토큰입니다.',
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

  it('accepts positive integer millisecond durations and finite cubic-bezier coordinates', () => {
    const tokens = [
      token('motion/duration/fast', 'duration', 'primitive', '120ms'),
      token(
        'motion/easing/standard',
        'cubicBezier',
        'primitive',
        'cubic-bezier(0.2, 0, 0, 1)',
      ),
    ];

    expect([...validateTokens(tokens).keys()]).toEqual([
      'motion/duration/fast',
      'motion/easing/standard',
    ]);
  });

  it.each(['12s', '0ms', '-120ms'])(
    'rejects invalid duration value %s',
    (value) => {
      const tokens = [
        token('motion/duration/invalid', 'duration', 'primitive', value),
      ];

      expect(() => validateTokens(tokens)).toThrow(
        'Primitive duration token "motion/duration/invalid" must use positive integer milliseconds.',
      );
    },
  );

  it.each([
    'ease',
    'cubic-bezier(0.2, 0, 1)',
    'cubic-bezier(0.2, NaN, 0, 1)',
    'cubic-bezier(0.2, 0, 0, Infinity)',
  ])('rejects malformed or non-finite cubic-bezier value %s', (value) => {
    const tokens = [
      token('motion/easing/invalid', 'cubicBezier', 'primitive', value),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Primitive cubicBezier token "motion/easing/invalid" must contain four finite coordinates.',
    );
  });

  it.each([
    'cubic-bezier(-0.1, 0, 0, 1)',
    'cubic-bezier(0.2, 0, 1.1, 1)',
  ])('rejects cubic-bezier x coordinates outside zero through one: %s', (value) => {
    const tokens = [
      token('motion/easing/invalid', 'cubicBezier', 'primitive', value),
    ];

    expect(() => validateTokens(tokens)).toThrow(
      'Primitive cubicBezier token "motion/easing/invalid" must keep x coordinates between 0 and 1.',
    );
  });
});
