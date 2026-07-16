import type { CSSProperties } from 'react';

const SAFE_LAYOUT_STYLE_KEYS = [
  'alignSelf',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'justifySelf',
  'margin',
  'marginBlock',
  'marginBlockEnd',
  'marginBlockStart',
  'marginBottom',
  'marginInline',
  'marginInlineEnd',
  'marginInlineStart',
  'marginLeft',
  'marginRight',
  'marginTop',
  'order',
  'placeSelf',
] as const satisfies readonly (keyof CSSProperties)[];

export function getSafeLayoutStyle(
  style: CSSProperties | undefined,
): CSSProperties | undefined {
  if (style === undefined) return undefined;

  const entries: Array<[string, unknown]> = [];
  for (const key of SAFE_LAYOUT_STYLE_KEYS) {
    const value = style[key];
    if (value !== undefined) entries.push([key, value]);
  }
  return entries.length > 0
    ? Object.fromEntries(entries) as CSSProperties
    : undefined;
}
