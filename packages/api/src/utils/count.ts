import { toDailyDatePeriod } from "@blobscan/dayjs";
import { env } from "@blobscan/env";
import { getRollupByAddress } from "@blobscan/rollups";

import type { Rollup } from "../../enums";
import type { Filters } from "../middlewares/withFilters";

/**
 * Determines if a direct count operation must be performed or the value can be obtained by using
 * pre-calculated values from aggregated stats tables, based on the provided filters.
 *
 * Aggregated stats are not available for certain filters, including:
 * - Reorged blocks (`blockType` filter)
 * - Specific `blockNumber` or `blockSlot` ranges
 * - Filters involving non-rollup addresses
 *
 * This function checks for those cases and returns `true` if a direct count is needed.
 *
 * @returns A boolean indicating if a direct count is required.
 */
export function requiresDirectCount({
  blockFilters = {},
  blockType,
  transactionFilters = {},
}: Filters) {
  const blockNumberRangeFilterEnabled = !!blockFilters?.number;
  const reorgedFilterEnabled = !!blockType?.some;
  const slotRangeFilterEnabled = !!blockFilters.slot;
  const nonRollupAddressesExists = transactionFilters.fromId?.in
    .map((addr) => getRollupByAddress(addr, env.CHAIN_ID))
    .some((r) => !r);

  return (
    blockNumberRangeFilterEnabled ||
    slotRangeFilterEnabled ||
    reorgedFilterEnabled ||
    transactionFilters.toId ||
    nonRollupAddressesExists
  );
}

export function buildStatsWhereClause({
  blockFilters,
  transactionFilters,
}: Filters) {
  const clauses = [];

  const filterRollups: Rollup[] = [];

  const rollups = transactionFilters?.from?.rollup?.in;
  const fromAddresses = transactionFilters?.fromId?.in;

  if (rollups) {
    filterRollups.push(...rollups);
  }

  if (fromAddresses) {
    const fromRollups = fromAddresses
      .map((addr) => getRollupByAddress(addr, env.CHAIN_ID))
      .filter((r): r is Rollup => !!r);
    filterRollups.push(...fromRollups);
  }

  const rollupsFilterEnabled = filterRollups.length > 0;

  // Set 'category' or 'rollup' to null when there are no corresponding filters
  // because the db stores total stats for each grouping in rows where
  // 'category' or 'rollup' is null.
  const rollup = rollupsFilterEnabled ? { in: filterRollups } : null;
  // Set 'category' to null when the rollup filter is present as we store rollup stats
  // in rows where 'category' is null.
  const category =
    (rollupsFilterEnabled ? null : transactionFilters?.category) ?? null;

  clauses.push(
    { category },
    {
      rollup,
    }
  );

  const { from, to } = toDailyDatePeriod({
    from: blockFilters?.timestamp?.gte,
    to: blockFilters?.timestamp?.lt,
  });

  if (from || to) {
    clauses.push({ day: { gte: from, lt: to } });
  }

  return {
    AND: clauses,
  };
}
