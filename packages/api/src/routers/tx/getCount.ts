import type { BlobscanPrismaClient } from "@blobscan/db";
import type { RollupRegistry } from "@blobscan/rollups";
import { z } from "@blobscan/zod";

import type { Filters } from "../../middlewares/withFilters";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { buildStatsWhereClause, requiresDirectCount } from "../../utils/count";

/**
 * Counts transactions based on the provided filters.
 *
 * This function decides between counting transactions directly from the transaction table
 * or using pre-calculated aggregated data from the daily or all-time metrics to
 * improve performance.
 *
 * The choice depends on the specificity of the filters provided.
 *
 */
export async function countTxs(
  prisma: BlobscanPrismaClient,
  filters: Filters,
  rollupRegistry: RollupRegistry
) {
  const { blockFilters = {}, blockType, transactionFilters } = filters;

  if (requiresDirectCount(filters, rollupRegistry)) {
    return prisma.transaction.count({
      where: {
        ...transactionFilters,
        blockNumber: blockFilters.number,
        blockTimestamp: blockFilters.timestamp,
        block: {
          slot: blockFilters.slot,
          transactionForks: blockType,
        },
      },
    });
  }

  const where = buildStatsWhereClause(filters, rollupRegistry);

  // Get count by summing daily total transaction metrics if a date range is provided in filters
  if (blockFilters.timestamp) {
    const dailyMetrics = await prisma.dailyMetrics.findMany({
      select: {
        totalTransactions: true,
      },
      where,
    });

    return dailyMetrics.reduce(
      (acc, { totalTransactions }) => acc + (totalTransactions ?? 0),
      0
    );
  }

  const allTimeMetrics = await prisma.allTimeMetrics.findMany({
    select: {
      totalTransactions: true,
    },
    where,
  });

  return allTimeMetrics.reduce(
    (acc, { totalTransactions }) => acc + (totalTransactions ?? 0),
    0
  );
}

const inputSchema = withAllFiltersSchema;

const outputSchema = z
  .object({
    totalTransactions: z.number(),
  })
  .transform(normalize);

export const getCount = publicProcedure
  .input(inputSchema)
  .use(withFilters)
  .output(outputSchema)
  .query(async ({ ctx: { filters, prisma, rollupRegistry } }) => {
    const txsCount = await countTxs(prisma, filters, rollupRegistry);

    return {
      totalTransactions: txsCount,
    };
  });
