export function resolvePortalContainer(
  requested: HTMLElement | null | undefined,
): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return requested ?? document.body;
}
