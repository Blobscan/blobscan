import dayjs from "@blobscan/dayjs";
import type { BlobscanPrismaClient, Prisma } from "@blobscan/db";
import { AddressSchema } from "@blobscan/db";
import type { TimeFrame } from "@blobscan/zod";
import { timeFrameSchema, z } from "@blobscan/zod";

import { getPeriodStart } from "../../middlewares/withStatFilters";
import { getTimeFrameDays } from "../../time-frames";

export const addressInputSchema = z.object({
  // The same as the address filters of the transactions: no format check, and
  // lower case, so that a checksummed address matches the stored value.
  address: AddressSchema.shape.address.transform((address) =>
    address.toLowerCase()
  ),
  timeFrame: timeFrameSchema
    .default("All")
    .describe(
      "The time frame of the metrics. The periods are hours for `1d` and `7d`, and days for the other time frames. The current period is included, and its values are partial."
    ),
});

export type AddressInput = z.output<typeof addressInputSchema>;

export type AddressGranularity = "hour" | "day";

export const ROLES = ["sent", "received"] as const;

export type Role = (typeof ROLES)[number];

/**
 * The metrics of one role. The columns have these names with the prefix
 * `sent` or `received`.
 */
export const ROLE_METRICS = [
  "TotalTransactions",
  "TotalBlobs",
  "TotalBlobUsageSize",
  "TotalBlobBaseFee",
  "TotalBlobAsCalldataFee",
  "TotalBlobBaseFeeUsd",
  "TotalBlobAsCalldataFeeUsd",
  "TotalUsdPricedTransactions",
] as const;

export type RoleMetric = (typeof ROLE_METRICS)[number];

type RoleColumn = `${Role}${RoleMetric}`;

export type RoleTotals = {
  totalTransactions: number;
  totalBlobs: number;
  totalBlobUsageSize: bigint;
  totalBlobBaseFee: Prisma.Decimal;
  totalBlobAsCalldataFee: Prisma.Decimal;
  totalBlobBaseFeeUsd: number | null;
  totalBlobAsCalldataFeeUsd: number | null;
  totalUsdPricedTransactions: number;
  firstBlockTimestamp: Date | null;
  lastBlockTimestamp: Date | null;
};

export const roleTotalsSchema = z.object({
  totalTransactions: z.number().int().nonnegative(),
  totalBlobs: z.number().int().nonnegative(),
  totalBlobUsageSize: z.bigint().nonnegative(),
  totalBlobBaseFee: z.bigint().nonnegative(),
  totalBlobAsCalldataFee: z.bigint().nonnegative(),
  totalBlobBaseFeeUsd: z.number().nonnegative().nullable(),
  totalBlobAsCalldataFeeUsd: z.number().nonnegative().nullable(),
  totalUsdPricedTransactions: z.number().int().nonnegative(),
  firstBlockTimestamp: z.date().nullable(),
  lastBlockTimestamp: z.date().nullable(),
});

export function getAddressGranularity(
  timeFrame: TimeFrame
): AddressGranularity {
  return timeFrame === "1d" || timeFrame === "7d" ? "hour" : "day";
}

/**
 * Returns the start of the first period of the time frame. The periods are
 * the `days` closed periods before the current period, and the current
 * period, the same as stats.getTimeseries with `includeCurrentPeriod`.
 * Returns undefined for `All`.
 */
export function getTimeFrameStart(
  timeFrame: TimeFrame,
  granularity: AddressGranularity,
  now = dayjs()
) {
  if (timeFrame === "All") {
    return undefined;
  }

  return getPeriodStart(now, granularity)
    .subtract(getTimeFrameDays(timeFrame), "day")
    .toDate();
}

export function getCurrentPeriodStart(
  granularity: AddressGranularity,
  now = dayjs()
) {
  return getPeriodStart(now, granularity).toDate();
}

/** Returns the Prisma `_sum` selection of all the role metrics. */
export function buildRoleSumSelection() {
  return Object.fromEntries(
    ROLES.flatMap((role) => ROLE_METRICS.map((m) => [`${role}${m}`, true]))
  ) as Record<RoleColumn, true>;
}

/** Returns the Prisma `_min` and `_max` selections of the role timestamps. */
export function buildRoleEdgeSelections() {
  return {
    _min: { sentFirstBlockTimestamp: true, receivedFirstBlockTimestamp: true },
    _max: { sentLastBlockTimestamp: true, receivedLastBlockTimestamp: true },
  } as const;
}

type RoleSums = Partial<Record<RoleColumn, unknown>> &
  Partial<Record<`${Role}${"First" | "Last"}BlockTimestamp`, Date | null>>;

/** Returns the row fields of a `_sum`, `_min` and `_max` result. */
export function mergeAggregates({
  _sum,
  _min,
  _max,
}: {
  _sum?: object | null;
  _min?: object | null;
  _max?: object | null;
}): RoleSums {
  return { ...(_sum ?? {}), ...(_min ?? {}), ...(_max ?? {}) } as RoleSums;
}

function toNumber(value: unknown) {
  return value === null || value === undefined ? 0 : Number(value);
}

function toNullableNumber(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function toBigInt(value: unknown) {
  return value === null || value === undefined ? BigInt(0) : BigInt(`${value}`);
}

function toDecimal(value: unknown, decimal: typeof Prisma.Decimal) {
  return new decimal(
    value === null || value === undefined ? 0 : (value as Prisma.Decimal)
  );
}

/** Returns the metrics of one role from a row or a `_sum` result. */
export function getRoleTotals(
  sums: RoleSums | null | undefined,
  role: Role,
  decimal: typeof Prisma.Decimal
): RoleTotals {
  const get = (metric: RoleMetric) => sums?.[`${role}${metric}`];

  return {
    totalTransactions: toNumber(get("TotalTransactions")),
    totalBlobs: toNumber(get("TotalBlobs")),
    totalBlobUsageSize: toBigInt(get("TotalBlobUsageSize")),
    totalBlobBaseFee: toDecimal(get("TotalBlobBaseFee"), decimal),
    totalBlobAsCalldataFee: toDecimal(get("TotalBlobAsCalldataFee"), decimal),
    totalBlobBaseFeeUsd: toNullableNumber(get("TotalBlobBaseFeeUsd")),
    totalBlobAsCalldataFeeUsd: toNullableNumber(
      get("TotalBlobAsCalldataFeeUsd")
    ),
    totalUsdPricedTransactions: toNumber(get("TotalUsdPricedTransactions")),
    firstBlockTimestamp: sums?.[`${role}FirstBlockTimestamp`] ?? null,
    lastBlockTimestamp: sums?.[`${role}LastBlockTimestamp`] ?? null,
  };
}

function minDate(a: Date | null, b: Date | null) {
  return a && b ? (a < b ? a : b) : a ?? b;
}

function maxDate(a: Date | null, b: Date | null) {
  return a && b ? (a > b ? a : b) : a ?? b;
}

export function decimalToBigInt(value: Prisma.Decimal) {
  return BigInt(value.toFixed(0));
}

/** Returns the role totals with the wei values as bigint, for the output. */
export function serializeRoleTotals(totals: RoleTotals) {
  return {
    ...totals,
    totalBlobBaseFee: decimalToBigInt(totals.totalBlobBaseFee),
    totalBlobAsCalldataFee: decimalToBigInt(totals.totalBlobAsCalldataFee),
  };
}

function addNullable(a: number | null, b: number | null) {
  return a === null && b === null ? null : (a ?? 0) + (b ?? 0);
}

/** Adds two role totals. A USD total stays null when both are null. */
export function addRoleTotals(a: RoleTotals, b: RoleTotals): RoleTotals {
  return {
    totalTransactions: a.totalTransactions + b.totalTransactions,
    totalBlobs: a.totalBlobs + b.totalBlobs,
    totalBlobUsageSize: a.totalBlobUsageSize + b.totalBlobUsageSize,
    totalBlobBaseFee: a.totalBlobBaseFee.add(b.totalBlobBaseFee),
    totalBlobAsCalldataFee: a.totalBlobAsCalldataFee.add(
      b.totalBlobAsCalldataFee
    ),
    totalBlobBaseFeeUsd: addNullable(
      a.totalBlobBaseFeeUsd,
      b.totalBlobBaseFeeUsd
    ),
    totalBlobAsCalldataFeeUsd: addNullable(
      a.totalBlobAsCalldataFeeUsd,
      b.totalBlobAsCalldataFeeUsd
    ),
    totalUsdPricedTransactions:
      a.totalUsdPricedTransactions + b.totalUsdPricedTransactions,
    firstBlockTimestamp: minDate(a.firstBlockTimestamp, b.firstBlockTimestamp),
    lastBlockTimestamp: maxDate(a.lastBlockTimestamp, b.lastBlockTimestamp),
  };
}

export type AddressTransactionRef = { hash: string; blockTimestamp: Date };

/**
 * Returns the first or the last canonical transaction of the address, in
 * either role. Each part of the UNION uses the (from_id | to_id,
 * block_timestamp, index) index, and stops at the first transaction that is
 * not forked.
 */
export async function findEdgeTransaction(
  prisma: BlobscanPrismaClient,
  address: string,
  edge: "first" | "last"
): Promise<AddressTransactionRef | null> {
  const order = edge === "first" ? "ASC" : "DESC";
  const notForked = `NOT EXISTS (
      SELECT 1 FROM transaction_fork f
      WHERE f.hash = t.hash AND f.block_hash = t.block_hash
    )`;

  const rows = await prisma.$queryRawUnsafe<
    { hash: string; block_timestamp: Date }[]
  >(
    `SELECT hash, block_timestamp FROM (
      (SELECT hash, block_timestamp, index FROM transaction t
        WHERE t.from_id = $1 AND ${notForked}
        ORDER BY block_timestamp ${order}, index ${order} LIMIT 1)
      UNION ALL
      (SELECT hash, block_timestamp, index FROM transaction t
        WHERE t.to_id = $1 AND ${notForked}
        ORDER BY block_timestamp ${order}, index ${order} LIMIT 1)
    ) edges
    ORDER BY block_timestamp ${order}, index ${order}
    LIMIT 1`,
    address
  );

  const [row] = rows;

  return row ? { hash: row.hash, blockTimestamp: row.block_timestamp } : null;
}
