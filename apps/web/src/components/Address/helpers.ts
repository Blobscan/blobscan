import type { AppRouterOutputs } from "@blobscan/api";

export type AddressOverall = AppRouterOutputs["address"]["getOverall"]["data"];
export type AddressTimeseries =
  AppRouterOutputs["address"]["getTimeseries"]["data"];
export type RoleTotals = AddressOverall["sent"];

export type AddressRole = "sent" | "received";

export const ADDRESS_SECTIONS = [
  "activity",
  "transactions",
  "blobs",
  "usage",
  "fees",
  "network",
] as const;

export type AddressSection = (typeof ADDRESS_SECTIONS)[number];

export const SECTION_LABELS: Record<AddressSection, string> = {
  activity: "Activity",
  transactions: "Transactions",
  blobs: "Blobs",
  usage: "Blob Usage",
  fees: "Fees",
  network: "Network",
};

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

/**
 * Returns the mean price of blob gas, in wei, that the address paid, and the
 * mean price of the network in the same periods. Both prices are weighted by
 * gas. A price is undefined when there is no blob gas.
 */
export function getBlobGasPrices(
  totals: Pick<RoleTotals, "totalBlobs" | "totalBlobBaseFee">,
  network: Pick<
    AddressOverall["network"],
    "totalBlobBaseFee" | "totalBlobGasUsed"
  >
): { address?: bigint; network?: bigint } {
  const gas = BigInt(totals.totalBlobs) * BigInt(BLOB_SIZE);
  const networkGas = toBigInt(network.totalBlobGasUsed);

  return {
    address: gas ? toBigInt(totals.totalBlobBaseFee) / gas : undefined,
    network: networkGas
      ? toBigInt(network.totalBlobBaseFee) / networkGas
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
 * Returns the mean of the values of the closed periods. The last period is
 * the current one, and its values are partial. When it is the only period,
 * it is used.
 */
export function getClosedPeriodsMean(values: number[]): number | undefined {
  const closed = values.length > 1 ? values.slice(0, -1) : values;

  return closed.length
    ? closed.reduce((sum, v) => sum + v, 0) / closed.length
    : undefined;
}

/** A timeseries column that has a count or a size for each period. */
export type SummableColumn =
  | "totalTransactions"
  | "totalBlobs"
  | "totalBlobUsageSize";

// A self-send is in the sent and in the received values. These columns have
// the self-send values, so that the sum counts a self-send one time. The data
// size of the self-sends is not stored, so it counts two times.
const SELF_COLUMNS: Partial<
  Record<SummableColumn, "selfTotalTransactions" | "selfTotalBlobs">
> = {
  totalTransactions: "selfTotalTransactions",
  totalBlobs: "selfTotalBlobs",
};

/**
 * Returns the sent and the received values of each period, together. A
 * self-send counts one time in the transactions and in the blobs.
 */
export function sumRoles(
  data: AddressTimeseries,
  column: SummableColumn
): number[] {
  const selfColumn = SELF_COLUMNS[column];

  return data.timestamps.map(
    (_, i) =>
      Number(data.sent[column][i] ?? 0) +
      Number(data.received[column][i] ?? 0) -
      (selfColumn ? data[selfColumn][i] ?? 0 : 0)
  );
}

/**
 * Returns the values of a column in each period: of one role, or of both
 * roles together (see sumRoles) when there is no role.
 */
function getColumnValues(
  data: AddressTimeseries,
  column: SummableColumn,
  role?: AddressRole
): number[] {
  return role
    ? data.timestamps.map((_, i) => Number(data[role][column][i] ?? 0))
    : sumRoles(data, column);
}

/**
 * Returns the UTC day with the largest value of a column, of one role or of
 * both roles together. Hourly periods are added into days. Returns undefined
 * when all the values are 0.
 */
export function getPeakDay(
  data: AddressTimeseries,
  column: SummableColumn,
  role?: AddressRole
): { day: Date; value: number } | undefined {
  const days = new Map<number, number>();

  getColumnValues(data, column, role).forEach((value, i) => {
    const timestamp = data.timestamps[i];

    if (!timestamp) {
      return;
    }

    const day = new Date(timestamp);

    day.setUTCHours(0, 0, 0, 0);
    days.set(day.getTime(), (days.get(day.getTime()) ?? 0) + value);
  });

  let peak: { day: Date; value: number } | undefined;

  days.forEach((value, time) => {
    if (value > 0 && (!peak || value > peak.value)) {
      peak = { day: new Date(time), value };
    }
  });

  return peak;
}

/**
 * Returns the mean of a column for each day, of one role or of both roles
 * together. The charts show the same mean as a line. An hourly mean is
 * multiplied by 24.
 */
export function getDailyMean(
  data: AddressTimeseries,
  column: SummableColumn,
  role?: AddressRole
): number | undefined {
  const mean = getClosedPeriodsMean(getColumnValues(data, column, role));

  return mean !== undefined && data.granularity === "hour" ? mean * 24 : mean;
}

/** A day with blob txs, as an item of the calendar heatmap. */
export type ActivityDay = {
  /** The UTC day, as YYYY-MM-DD. */
  date: string;
  sent: number;
  received: number;
  /** The txs of both roles. */
  value: number;
  /** True when the day is in the longest streak of the address. */
  highlighted: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the days with blob txs of a daily timeseries, in order. The days of
 * the longest run of consecutive active days are highlighted. When two runs
 * have the same length, the most recent one is highlighted.
 */
export function getActivityDays(data: AddressTimeseries): ActivityDay[] {
  const days: ActivityDay[] = data.timestamps.flatMap((timestamp, i) => {
    const sent = data.sent.totalTransactions[i] ?? 0;
    const received = data.received.totalTransactions[i] ?? 0;

    return sent || received
      ? [
          {
            date: new Date(timestamp).toISOString().slice(0, 10),
            sent,
            received,
            value: sent + received,
            highlighted: false,
          },
        ]
      : [];
  });

  let best: ActivityDay[] = [];
  let run: ActivityDay[] = [];

  days.forEach((day, i) => {
    const prev = days[i - 1];
    const isNextDay =
      !!prev && Date.parse(day.date) - Date.parse(prev.date) === DAY_MS;

    run = isNextDay ? [...run, day] : [day];

    if (run.length >= best.length) {
      best = run;
    }
  });

  best.forEach((day) => {
    day.highlighted = true;
  });

  return days;
}
