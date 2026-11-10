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
  avgBlobsPerTx?: number;
  avgFeePerTx?: bigint;
  avgFeePerTxUsd?: number;
  /** Bytes with data ÷ blob bytes, from 0 to 1. */
  utilization?: number;
  blobSize: bigint;
  /** Blob bytes without data. */
  unusedSize: bigint;
  /** The blob fee of the unused bytes. */
  unusedFee?: bigint;
  unusedFeeUsd?: number;
  /** Blob fee for each KiB with data. */
  costPerKb?: bigint;
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
  const usd = totalBlobBaseFeeUsd ?? undefined;
  const unusedFee = blobSize ? (fee * unusedSize) / blobSize : undefined;

  return {
    avgBlobsPerTx: ratio(totalBlobs, totalTransactions),
    avgFeePerTx: totalTransactions
      ? fee / BigInt(totalTransactions)
      : undefined,
    avgFeePerTxUsd:
      usd !== undefined && totalUsdPricedTransactions
        ? usd / totalUsdPricedTransactions
        : undefined,
    utilization,
    blobSize,
    unusedSize,
    unusedFee,
    unusedFeeUsd:
      usd !== undefined && utilization !== undefined
        ? usd * (1 - utilization)
        : undefined,
    costPerKb: usage ? (fee * BigInt(1024)) / usage : undefined,
    costPerKbUsd:
      usd !== undefined && usage ? usd / (Number(usage) / 1024) : undefined,
    calldataSavings: toBigInt(totalBlobAsCalldataFee) - fee,
    calldataSavingsUsd:
      totalBlobAsCalldataFeeUsd !== null && usd !== undefined
        ? totalBlobAsCalldataFeeUsd - usd
        : undefined,
  };
}
