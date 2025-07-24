export function hasProperties(obj: Record<string, unknown>) {
  return Object.values(obj).length > 0;
}

export function isNullish<T>(
  value: T | null | undefined
): value is null | undefined {
  return value === null || value === undefined;
}

export function isFullyDefined<T extends object>(obj: Partial<T>): obj is T {
  const objValues = Object.values(obj);

  return !!objValues.length && objValues.every((value) => value !== undefined);
}
