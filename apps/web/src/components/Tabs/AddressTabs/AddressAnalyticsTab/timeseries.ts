import type { AddressTimeseries } from "./types";

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
