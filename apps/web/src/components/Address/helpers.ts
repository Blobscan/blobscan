import type { AppRouterOutputs } from "@blobscan/api";

export type AddressOverall = AppRouterOutputs["address"]["getOverall"]["data"];
export type AddressTimeseries =
  AppRouterOutputs["address"]["getTimeseries"]["data"];
export type RoleTotals = AddressOverall["sent"];

export type AddressRole = "sent" | "received";

export const ROLE_LABELS: Record<AddressRole, string> = {
  sent: "Sent",
  received: "Received",
};

// Each blob uses this blob gas and has this size in bytes.
export const BLOB_SIZE = 131_072;

/**
 * Returns the roles that the page shows. The received role shows only when
 * the address received a transaction that is not a self-send. Thus an address
 * that only sends to itself shows as a sender only.
 */
export function getShownRoles({
  sentTotalTransactions,
  receivedTotalTransactions,
  selfTotalTransactions,
}: {
  sentTotalTransactions: number;
  receivedTotalTransactions: number;
  selfTotalTransactions: number;
}): AddressRole[] {
  const roles: AddressRole[] = [];

  if (sentTotalTransactions > 0) {
    roles.push("sent");
  }

  if (receivedTotalTransactions > selfTotalTransactions) {
    roles.push("received");
  }

  return roles;
}

/**
 * Returns the main role (the shown role with more transactions) and the other
 * shown role, if there is one.
 */
export function getMainRole(
  roles: AddressRole[],
  totals: Record<AddressRole, { totalTransactions: number }>
): { main: AddressRole; other?: AddressRole } {
  const [first, second] = roles;

  if (!first) {
    return { main: "sent" };
  }

  if (!second) {
    return { main: first };
  }

  return totals.sent.totalTransactions >= totals.received.totalTransactions
    ? { main: "sent", other: "received" }
    : { main: "received", other: "sent" };
}

function toBigInt(value: bigint | number | string) {
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
  wastedSize: bigint;
  /** The blob fee of the wasted bytes. */
  wastedFee?: bigint;
  wastedFeeUsd?: number;
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
  const wastedSize = blobSize - usage;
  const utilization = ratio(usage, blobSize);
  const usd = totalBlobBaseFeeUsd ?? undefined;

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
    wastedSize,
    wastedFee: blobSize ? (fee * wastedSize) / blobSize : undefined,
    wastedFeeUsd:
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

/**
 * Returns the price that the address paid for each unit of blob gas, divided
 * by the price of the network in the same periods. Both prices are weighted
 * by gas. A value below 1 means that the address posted when blob gas cost
 * less than the network average.
 */
export function getTimingRatio(
  totals: Pick<RoleTotals, "totalBlobs" | "totalBlobBaseFee">,
  network: Pick<
    AddressOverall["network"],
    "totalBlobBaseFee" | "totalBlobGasUsed"
  >
): number | undefined {
  const gas = BigInt(totals.totalBlobs) * BigInt(BLOB_SIZE);
  const addressPrice = ratio(toBigInt(totals.totalBlobBaseFee), gas);
  const networkPrice = ratio(
    toBigInt(network.totalBlobBaseFee),
    toBigInt(network.totalBlobGasUsed)
  );

  if (addressPrice === undefined || !networkPrice) {
    return undefined;
  }

  return addressPrice / networkPrice;
}

/** Returns the share of the network blobs, from 0 to 1. */
export function getNetworkShare(
  totalBlobs: number,
  networkTotalBlobs: number
): number | undefined {
  return ratio(totalBlobs, networkTotalBlobs);
}

/**
 * Returns the average time between two transactions, in milliseconds.
 */
export function getCadence(
  totalTransactions: number,
  first?: Date | null,
  last?: Date | null
): number | undefined {
  if (!first || !last || totalTransactions < 2) {
    return undefined;
  }

  return (last.getTime() - first.getTime()) / (totalTransactions - 1);
}
