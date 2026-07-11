export function mergeIds(
  ...values: Array<string | undefined>
): string | undefined {
  const ids = values
    .flatMap((value) => value?.split(/\s+/) ?? [])
    .filter(
      (value, index, all) =>
        value.length > 0 && all.indexOf(value) === index,
    );
  return ids.length > 0 ? ids.join(' ') : undefined;
}
