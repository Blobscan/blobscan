import { toDailyDatePeriod } from "@blobscan/dayjs";

import { getRollupFromAddressFilter } from "../middlewares/withFilters";
import type { Filters } from "../middlewares/withFilters";

/**
 * Determines if a direct count operation must be performed or the value can be obtained by using
 * pre-calculated values from aggregated stats tables, based on the provided filters.
 *
 * Aggregated stats are not available for certain filters, including:
 * - Reorged blocks (`blockType` filter)
 * - Specific `blockNumber` or `blockSlot` ranges
 * - Filters involving multiple addresses or non-rollup addresses
 *
 * This function checks for those cases and returns `true` if a direct count is needed.
 *
 * @returns A boolean indicating if a direct count is required.
 */
export function requiresDirectCount({
  blockNumber,
  blockSlot,
  transactionAddresses,
  blockType,
}: Filters) {
  const blockNumberRangeFilterEnabled = !!blockNumber;
  const reorgedFilterEnabled = !!blockType?.some;
  const slotRangeFilterEnabled = !!blockSlot;
  const addressFiltersCount = transactionAddresses?.length ?? 0;
  const severalAddressesFilterEnabled = addressFiltersCount > 1;
  const nonRollupAddressFilterEnabled =
    addressFiltersCount === 1 &&
    !getRollupFromAddressFilter(transactionAddresses);

  return (
    blockNumberRangeFilterEnabled ||
    slotRangeFilterEnabled ||
    reorgedFilterEnabled ||
    severalAddressesFilterEnabled ||
    nonRollupAddressFilterEnabled
  );
}

export function buildStatsWhereClause({
  blockTimestamp,
  transactionCategory,
  transactionRollup,
  transactionAddresses,
}: Filters) {
  const clauses = [];
  // We set 'category' or 'rollup' to null when there are no corresponding filters
  // because the db stores total statistics for each grouping in rows where
  // 'category' or 'rollup' is null.
  const rollup =
    transactionRollup ??
    getRollupFromAddressFilter(transactionAddresses) ??
    null;

  const category = (rollup ? null : transactionCategory) ?? null;

  clauses.push({ category }, { rollup });

  const { from, to } = toDailyDatePeriod({
    from: blockTimestamp?.gte,
    to: blockTimestamp?.lt,
  });

  if (from || to) {
    clauses.push({ day: { gte: from, lt: to } });
  }

  return {
    AND: clauses,
  };
}
