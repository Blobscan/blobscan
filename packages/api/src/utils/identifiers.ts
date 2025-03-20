function isValidInt(number: number): boolean {
  const minInt = -2147_483_648;
  const maxInt = 2147_483_647;

  return number >= minInt && number <= maxInt;
}
/**
 *
 * Checks if the given string is a number
 */
export function isBlockNumber(number: string): boolean {
  const number_ = Number(number);

  return !isNaN(number_) && isValidInt(number_);
}

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
