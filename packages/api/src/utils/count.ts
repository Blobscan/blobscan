import { toDailyDatePeriod } from "@blobscan/dayjs";

import { getRollupFromAddressFilter } from "../middlewares/withFilters";
import type { Filters } from "../middlewares/withFilters";

export function hasToPerformCount({
  blockNumber,
  blockSlot,
  transactionAddresses,
  blockType,
}: Filters) {
  const addressFiltersCount = transactionAddresses?.length ?? 0;
  const hasRollupAsAddress = !!getRollupFromAddressFilter(transactionAddresses);
  const reorgedFilterEnabled = !!blockType?.some;

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
