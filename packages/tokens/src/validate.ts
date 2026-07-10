import { z } from 'zod';

import type { TokenDefinition } from './types.js';

const aliasPattern = /^\{([^{}]+)\}$/;
const namePattern = /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;

const tokenDefinitionSchema = z
  .object({
    name: z.string().regex(namePattern),
    type: z.enum([
      'color',
      'dimension',
      'fontFamily',
      'fontWeight',
      'shadow',
    ]),
    kind: z.enum(['primitive', 'semantic']),
    value: z.union([z.string(), z.number()]),
    description: z.string().trim().min(1),
  })
  .strict();

const tokenArraySchema = z.array(tokenDefinitionSchema);

function aliasTarget(value: string | number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return aliasPattern.exec(value)?.[1] ?? null;
}

function validatePrimitiveValue(token: TokenDefinition): void {
  if (aliasTarget(token.value) !== null) {
    throw new Error(
      `Primitive token "${token.name}" must contain a raw value.`,
    );
  }

  const expectsNumber =
    token.type === 'dimension' || token.type === 'fontWeight';

  if (expectsNumber && typeof token.value !== 'number') {
    throw new Error(
      `Primitive token "${token.name}" of type ${token.type} must be numeric.`,
    );
  }

  if (!expectsNumber && typeof token.value !== 'string') {
    throw new Error(
      `Primitive token "${token.name}" of type ${token.type} must be a string.`,
    );
  }
}

export function validateTokens(
  tokens: TokenDefinition[],
): Map<string, TokenDefinition> {
  const parsedTokens: TokenDefinition[] = tokenArraySchema.parse(tokens);
  const byName = new Map<string, TokenDefinition>();

  for (const token of parsedTokens) {
    if (byName.has(token.name)) {
      throw new Error(`Duplicate token name: ${token.name}`);
    }

    byName.set(token.name, token);
  }

  for (const token of byName.values()) {
    const targetName = aliasTarget(token.value);

    if (token.kind === 'primitive') {
      validatePrimitiveValue(token);
      continue;
    }

    if (targetName === null) {
      const label = token.type === 'color' ? 'Semantic color token' : 'Semantic token';
      throw new Error(`${label} "${token.name}" must use an alias.`);
    }

    const target = byName.get(targetName);
    if (target === undefined) {
      throw new Error(
        `Unknown alias target "${targetName}" referenced by "${token.name}".`,
      );
    }

    if (target.type !== token.type) {
      throw new Error(
        `Alias type mismatch: "${token.name}" (${token.type}) references "${target.name}" (${target.type}).`,
      );
    }
  }

  const state = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];

  const visit = (name: string): void => {
    const currentState = state.get(name);
    if (currentState === 'visited') {
      return;
    }

    if (currentState === 'visiting') {
      const cycleStart = stack.indexOf(name);
      const cycle = [...stack.slice(cycleStart), name];
      throw new Error(`Alias cycle: ${cycle.join(' -> ')}`);
    }

    state.set(name, 'visiting');
    stack.push(name);

    const token = byName.get(name);
    if (token === undefined) {
      throw new Error(`Token disappeared during validation: ${name}`);
    }

    const targetName = aliasTarget(token.value);
    if (targetName !== null) {
      visit(targetName);
    }

    stack.pop();
    state.set(name, 'visited');
  };

  for (const name of byName.keys()) {
    visit(name);
  }

  return byName;
}
