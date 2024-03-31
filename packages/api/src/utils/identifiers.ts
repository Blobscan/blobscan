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

export function isEmptyObject(obj: Record<string, unknown>) {
  return Object.values(obj).length === 0;
}
