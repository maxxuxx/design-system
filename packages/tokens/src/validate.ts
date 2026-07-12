import { z } from 'zod';

import type { TokenDefinition } from './types.js';

const aliasPattern = /^\{([^{}]+)\}$/;
const namePattern = /^[a-z0-9]+(?:[/-][a-z0-9]+)*$/;
const durationPattern = /^[1-9]\d*ms$/;
const cubicBezierPattern =
  /^cubic-bezier\(\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*,\s*([^,]+?)\s*\)$/;
const cssNumberPattern =
  /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i;

const tokenDefinitionSchema = z
  .object({
    name: z.string().regex(namePattern),
    type: z.enum([
      'color',
      'dimension',
      'fontFamily',
      'fontWeight',
      'shadow',
      'duration',
      'cubicBezier',
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

  if (
    token.type === 'duration' &&
    (typeof token.value !== 'string' || !durationPattern.test(token.value))
  ) {
    throw new Error(
      `Primitive duration token "${token.name}" must use positive integer milliseconds.`,
    );
  }

  if (token.type !== 'cubicBezier' || typeof token.value !== 'string') {
    return;
  }

  const match = cubicBezierPattern.exec(token.value);
  const coordinateSources = match?.slice(1).map((value) => value.trim());
  const coordinates = coordinateSources?.map(Number);

  if (
    coordinateSources === undefined ||
    coordinates === undefined ||
    coordinateSources.some((value) => !cssNumberPattern.test(value)) ||
    coordinates.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(
      `Primitive cubicBezier token "${token.name}" must contain four finite coordinates.`,
    );
  }

  const firstX = coordinates[0];
  const secondX = coordinates[2];
  if (
    firstX === undefined ||
    secondX === undefined ||
    firstX < 0 ||
    firstX > 1 ||
    secondX < 0 ||
    secondX > 1
  ) {
    throw new Error(
      `Primitive cubicBezier token "${token.name}" must keep x coordinates between 0 and 1.`,
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
