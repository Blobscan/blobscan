import { toDailyDatePeriod } from "@blobscan/dayjs";

import type { Rollup } from "../../enums";
import {
  extractAddressesFromFilter,
  extractRollupsFromFilter,
} from "../middlewares/withFilters";
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
  blockNumber,
  blockSlot,
  transactionAddresses,
  blockType,
}: Filters) {
  const blockNumberRangeFilterEnabled = !!blockNumber;
  const reorgedFilterEnabled = !!blockType?.some;
  const slotRangeFilterEnabled = !!blockSlot;
  const addresses = extractAddressesFromFilter(transactionAddresses);
  const rollups = extractRollupsFromFilter(transactionAddresses);
  const nonRollupAddressesPresent = addresses.length !== rollups.length;

  return (
    blockNumberRangeFilterEnabled ||
    slotRangeFilterEnabled ||
    reorgedFilterEnabled ||
    nonRollupAddressesPresent
  );
}

export function buildStatsWhereClause({
  blockTimestamp,
  transactionCategory,
  transactionRollup,
  transactionAddresses,
}: Filters) {
  const clauses = [];

  const filterRollups: Rollup[] = [];

  if (transactionRollup) {
    filterRollups.push(transactionRollup);
  }

  if (transactionAddresses) {
    filterRollups.push(...extractRollupsFromFilter(transactionAddresses));
  }

  const rollupsFilterPresent = filterRollups.length > 0;
  const singleRollupFilter = filterRollups.length === 1;

  // Set 'category' or 'rollup' to null when there are no corresponding filters
  // because the db stores total stats for each grouping in rows where
  // 'category' or 'rollup' is null.
  const rollup = rollupsFilterPresent
    ? singleRollupFilter
      ? filterRollups[0]
      : { in: filterRollups }
    : null;
  // Set 'category' to null when the rollup filter is present as we store rollup stats
  // in rows where 'category' is null.
  const category = (rollupsFilterPresent ? null : transactionCategory) ?? null;

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
