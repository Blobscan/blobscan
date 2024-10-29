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
  const addressFiltersCount = transactionAddresses?.length ?? 0;
  const hasRollupAsAddress = !!getRollupFromAddressFilter(transactionAddresses);
  const reorgedFilterEnabled = !!blockType?.some;

  // We
  return (
    blockNumber ||
    blockSlot ||
    reorgedFilterEnabled ||
    addressFiltersCount > 1 ||
    (addressFiltersCount === 1 && !hasRollupAsAddress)
  );
}

export function buildCountStatsFilters({
  blockTimestamp,
  transactionCategory,
  transactionRollup,
  transactionAddresses,
}: Filters) {
  // We set 'category' or 'rollup' to null when there are no corresponding filters
  // because the db stores total statistics for each grouping in rows where
  // 'category' or 'rollup' is null.
  const rollup =
    transactionRollup ??
    getRollupFromAddressFilter(transactionAddresses) ??
    null;
  const category = (rollup ? null : transactionCategory) ?? null;
  const { from: fromDay, to: toDay } = toDailyDatePeriod({
    from: blockTimestamp?.gte,
    to: blockTimestamp?.lt,
  });

  return {
    category,
    rollup,
    fromDay,
    toDay,
  };
}
