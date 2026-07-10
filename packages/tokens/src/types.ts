export type TokenType =
  | 'color'
  | 'dimension'
  | 'fontFamily'
  | 'fontWeight'
  | 'shadow';

export interface TokenDefinition {
  name: string;
  type: TokenType;
  kind: 'primitive' | 'semantic';
  value: string | number;
  description: string;
}

export interface ResolvedToken extends TokenDefinition {
  cssVariable: `--ds-${string}`;
  resolvedValue: string | number;
}
