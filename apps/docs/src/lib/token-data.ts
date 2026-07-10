import artifact from '@maxxuxx/tokens/tokens.json';

export interface TokenRecord {
  name: string;
  type: 'color' | 'dimension' | 'fontFamily' | 'fontWeight' | 'shadow';
  kind: 'primitive' | 'semantic';
  value: string | number;
  description: string;
  cssVariable: `--ds-${string}`;
  resolvedValue: string | number;
}

if (artifact.schemaVersion !== 1 || !Array.isArray(artifact.tokens)) {
  throw new Error('Unsupported token artifact. Expected schemaVersion 1.');
}

export const tokens = artifact.tokens as TokenRecord[];

export function tokensByPrefix(prefix: string): TokenRecord[] {
  return tokens.filter(({ name }) => name.startsWith(prefix));
}

export function tokenByName(name: string): TokenRecord {
  const token = tokens.find((candidate) => candidate.name === name);
  if (!token) throw new Error(`Unknown token: ${name}`);
  return token;
}
