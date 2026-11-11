import type { RoleTotals } from "../types";

// Each blob uses this blob gas and has this size in bytes.
export const BLOB_SIZE = 131_072;

export function toBigInt(value: bigint | number | string) {
  return BigInt(value);
}

/** Returns a / b as a number, or undefined when b is zero. */
export function ratio(
  a: bigint | number,
  b: bigint | number
): number | undefined {
  if (typeof a === "bigint" || typeof b === "bigint") {
    const bb = toBigInt(b);

    if (bb === BigInt(0)) {
      return undefined;
    }

    // Keep 6 decimal places of precision with integer division.
    const scale = BigInt(1_000_000);

    return Number((toBigInt(a) * scale) / bb) / 1_000_000;
  }

  return b === 0 ? undefined : a / b;
}

export type DerivedMetrics = {
  totalFeeUsd?: number;
  avgBlobsPerTx: number;
  avgFeePerTx: bigint;
  avgFeePerTxUsd?: number;
  /** Bytes with data ÷ blob bytes, from 0 to 1. */
  utilization?: number;
  blobSize: bigint;
  /** Blob bytes without data. */
  unusedSize: bigint;
  /** The blob fee of the unused bytes. */
  unusedFee: bigint;
  unusedFeeUsd?: number;
  /** Blob fee for each KiB with data. */
  costPerKb: bigint | null;
  costPerKbUsd?: number;
  calldataSavings: bigint;
  calldataSavingsUsd?: number;
};

export function getDerivedMetrics(totals: RoleTotals): DerivedMetrics {
  const {
    totalTransactions,
    totalBlobs,
    totalBlobUsageSize,
    totalBlobBaseFee,
    totalBlobAsCalldataFee,
    totalBlobBaseFeeUsd,
    totalBlobAsCalldataFeeUsd,
    totalUsdPricedTransactions,
  } = totals;
  const fee = toBigInt(totalBlobBaseFee);
  const usage = toBigInt(totalBlobUsageSize);
  const blobSize = BigInt(totalBlobs) * BigInt(BLOB_SIZE);
  const unusedSize = blobSize - usage;
  const utilization = ratio(usage, blobSize);
  // An empty address has no fees, even when no USD price is available.
  const usd = totalTransactions ? totalBlobBaseFeeUsd ?? undefined : 0;
  const unusedFee = blobSize ? (fee * unusedSize) / blobSize : BigInt(0);

  return {
    totalFeeUsd: usd,
    avgBlobsPerTx: ratio(totalBlobs, totalTransactions) ?? 0,
    avgFeePerTx: totalTransactions
      ? fee / BigInt(totalTransactions)
      : BigInt(0),
    avgFeePerTxUsd: totalTransactions
      ? usd !== undefined && totalUsdPricedTransactions
        ? usd / totalUsdPricedTransactions
        : undefined
      : 0,
    utilization,
    blobSize,
    unusedSize,
    unusedFee,
    unusedFeeUsd:
      usd !== undefined ? usd * (1 - (utilization ?? 0)) : undefined,
    costPerKb: totalTransactions
      ? usage
        ? (fee * BigInt(1024)) / usage
        : null
      : BigInt(0),
    costPerKbUsd:
      usd !== undefined
        ? usage
          ? usd / (Number(usage) / 1024)
          : totalTransactions
          ? undefined
          : 0
        : undefined,
    calldataSavings: toBigInt(totalBlobAsCalldataFee) - fee,
    calldataSavingsUsd: totalTransactions
      ? totalBlobAsCalldataFeeUsd !== null && usd !== undefined
        ? totalBlobAsCalldataFeeUsd - usd
        : undefined
      : 0,
  };
}
