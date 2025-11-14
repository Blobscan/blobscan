import { toDailyDatePeriod } from "@blobscan/dayjs";
import type { Category, Rollup } from "@blobscan/db/prisma/enums";
import type { RollupRegistry } from "@blobscan/rollups";

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
export function requiresDirectCount(
  { blockFilters = {}, blockType, transactionFilters = {} }: Filters,
  rollupRegistry: RollupRegistry
) {
  const blockNumberRangeFilterEnabled = !!blockFilters?.number;
  const reorgedFilterEnabled = !!blockType?.some;
  const slotRangeFilterEnabled = !!blockFilters.slot;
  const nonRollupAddressesExists = transactionFilters.fromId?.in
    .map((addr) => rollupRegistry.getRollup(addr))
    .some((r) => !r);

  return (
    blockNumberRangeFilterEnabled ||
    slotRangeFilterEnabled ||
    reorgedFilterEnabled ||
    transactionFilters.toId ||
    nonRollupAddressesExists
  );
}

export function buildStatsWhereClause(
  { blockFilters, transactionFilters }: Filters,
  rollupRegistry: RollupRegistry
) {
  const clauses = [];
  const fromAddressFilter = transactionFilters?.fromId?.in;
  let categoryClause: Category | null = null;
  let rollupClause: null | { in: Rollup[] } | { not: null } = null;

  if (transactionFilters?.from?.rollup !== undefined) {
    // When "not" is present in the rollup filter, it means we are looking for rollup addresses only.
    categoryClause =
      transactionFilters.from.rollup === null ? "OTHER" : "ROLLUP";
  } else if (fromAddressFilter?.length) {
    const resolvedRollups = fromAddressFilter
      .map((addr) => rollupRegistry.getRollup(addr))
      .filter((r): r is Rollup => !!r);

    rollupClause = { in: Array.from(new Set(resolvedRollups)) };
  }

  clauses.push(
    { category: categoryClause },
    {
      rollup: rollupClause,
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
