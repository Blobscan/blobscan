import { toDailyDatePeriod } from "@blobscan/dayjs";
import { env } from "@blobscan/env";
import { getRollupByAddress } from "@blobscan/rollups";

import type { Category, Rollup } from "../../enums";
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
  const fromAddressFilter = transactionFilters?.fromId?.in;
  let rollupFilter = transactionFilters?.from?.rollup;

  if (fromAddressFilter) {
    const resolvedRollups = fromAddressFilter
      .map((addr) => getRollupByAddress(addr, env.CHAIN_ID))
      .filter((r): r is Rollup => !!r);

    if (resolvedRollups.length) {
      if (rollupFilter && "in" in rollupFilter) {
        rollupFilter.in.push(...resolvedRollups);
      } else {
        rollupFilter = { in: resolvedRollups };
      }
    }
  }

  let categoryClause: Category | null = null;
  let rollupClause: null | { in: Rollup[] } | { not: null } = null;

  if (rollupFilter === null) {
    categoryClause = "OTHER";
  } else if (rollupFilter !== undefined) {
    // When "not" is present in the rollup filter, it means we are looking for rollup addresses only.
    if ("not" in rollupFilter) {
      categoryClause = "ROLLUP";
    } else {
      rollupClause = rollupFilter;
    }
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
