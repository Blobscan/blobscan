import type { Prisma } from "@blobscan/db";

export function decimalToBigInt(decimal: Prisma.Decimal): bigint {
  /**
   * When no param is provided, toFixed() returns the value in normal notation
   * avoiding exponential notation.
   */
  return BigInt(decimal.toFixed());
}
