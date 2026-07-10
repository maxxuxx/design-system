import type { ResolvedToken, TokenDefinition } from './types.js';
import { validateTokens } from './validate.js';

const aliasPattern = /^\{([^{}]+)\}$/;

function aliasTarget(value: string | number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return aliasPattern.exec(value)?.[1] ?? null;
}

export function toCssVariable(name: string): `--ds-${string}` {
  return `--ds-${name.replaceAll('/', '-')}`;
}

export function resolveTokens(
  tokens: TokenDefinition[],
): ResolvedToken[] {
  const byName = validateTokens(tokens);
  const cache = new Map<string, string | number>();

  const resolveValue = (name: string): string | number => {
    const cached = cache.get(name);
    if (cached !== undefined) {
      return cached;
    }

    const token = byName.get(name);
    if (token === undefined) {
      throw new Error(`Cannot resolve unknown token: ${name}`);
    }

    const targetName = aliasTarget(token.value);
    const resolved =
      targetName === null ? token.value : resolveValue(targetName);
    cache.set(name, resolved);
    return resolved;
  };

  return [...byName.values()].map((token) => ({
    ...token,
    cssVariable: toCssVariable(token.name),
    resolvedValue: resolveValue(token.name),
  }));
}

function renderCssValue(token: ResolvedToken): string {
  const targetName = aliasTarget(token.value);
  if (targetName !== null) {
    return `var(${toCssVariable(targetName)})`;
  }

  switch (token.type) {
    case 'dimension':
      return `${token.value}px`;
    case 'fontWeight':
      return String(token.value);
    case 'color':
    case 'fontFamily':
    case 'shadow':
      return String(token.value);
  }
}

export function renderCss(tokens: ResolvedToken[]): string {
  const declarations = tokens.map(
    (token) => `  ${token.cssVariable}: ${renderCssValue(token)};`,
  );

  return [':root {', ...declarations, '}', ''].join('\n');
}

export function renderJson(tokens: ResolvedToken[]): string {
  return `${JSON.stringify({ schemaVersion: 1, tokens }, null, 2)}\n`;
}
