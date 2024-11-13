import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { Filters } from "../../middlewares/withFilters";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { buildStatsWhereClause, requiresDirectCount } from "../../utils/count";

/**
 * Counts transactions based on the provided filters.
 *
 * This function decides between counting transactions directly from the transaction table
 * or using pre-calculated aggregated data from daily or overall transaction stats to
 * improve performance.
 *
 * The choice depends on the specificity of the filters provided.
 *
 */
export async function countTxs(prisma: BlobscanPrismaClient, filters: Filters) {
  const {
    blockNumber,
    blockTimestamp,
    transactionAddresses,
    transactionCategory,
    transactionRollup,
    blockSlot,
    blockType,
  } = filters;

  if (requiresDirectCount(filters)) {
    return prisma.transaction.count({
      where: {
        blockNumber: blockNumber,
        blockTimestamp: blockTimestamp,
        category: transactionCategory,
        rollup: transactionRollup,
        OR: transactionAddresses,
        block: {
          slot: blockSlot,
          transactionForks: blockType,
        },
      },
    });
  }

  const where = buildStatsWhereClause(filters);

  // Get count by summing daily total transaction stats data if a date range is provided in filters
  if (filters.blockTimestamp) {
    const dailyStats = await prisma.dailyStats.findMany({
      select: {
        totalTransactions: true,
      },
      where,
    });

    return dailyStats.reduce(
      (acc, { totalTransactions }) => acc + totalTransactions,
      0
    );
  }

  const overallStats = await prisma.overallStats.findMany({
    select: {
      totalTransactions: true,
    },
    where,
  });

  return overallStats.reduce(
    (acc, { totalTransactions }) => acc + totalTransactions,
    0
  );
}

const inputSchema = withAllFiltersSchema;

const outputSchema = z.object({
  totalTransactions: z.number(),
});

export const getCount = publicProcedure
  .input(inputSchema)
  .use(withFilters)
  .output(outputSchema)
  .query(async ({ ctx: { filters, prisma } }) => {
    const txsCount = await countTxs(prisma, filters);

    return {
      totalTransactions: txsCount,
    };
  });
