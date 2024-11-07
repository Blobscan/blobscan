import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { Filters } from "../../middlewares/withFilters";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { buildStatsWhereClause, requiresDirectCount } from "../../utils/count";

const inputSchema = withAllFiltersSchema;

const outputSchema = z.object({
  totalBlobs: z.number(),
});

/**
 * Counts blobs based on the provided filters.
 *
 * This function decides between counting blobs directly from the blob table
 * or using pre-calculated aggregated data from daily or overall blob stats
 * to improve performance.
 *
 * The choice depends on the specificity of the filters provided.
 */
export async function countBlobs(
  prisma: BlobscanPrismaClient,
  filters: Filters
) {
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
    const transactionFiltersEnabled =
      transactionCategory || transactionRollup || transactionAddresses;

    return prisma.blobsOnTransactions.count({
      where: {
        blockNumber,
        blockTimestamp,
        block: {
          slot: blockSlot,
          transactionForks: blockType,
        },
        transaction: transactionFiltersEnabled
          ? {
              category: transactionCategory,
              rollup: transactionRollup,
              OR: transactionAddresses,
            }
          : undefined,
      },
    });
  }

  const where = buildStatsWhereClause(filters);

  // Get count by summing daily total transaction stats data if a date range is provided in filters
  if (filters.blockTimestamp) {
    const dailyStats = await prisma.blobDailyStats.findMany({
      select: {
        day: true,
        totalBlobs: true,
      },
      where,
    });

    return dailyStats.reduce((acc, { totalBlobs }) => acc + totalBlobs, 0);
  }

  const overallStats = await prisma.blobOverallStats.findFirst({
    select: {
      totalBlobs: true,
    },
    where,
  });

  return overallStats?.totalBlobs ?? 0;
}

export const getCount = publicProcedure
  .input(inputSchema)
  .use(withFilters)
  .output(outputSchema)
  .query(async ({ ctx: { filters, prisma } }) => {
    const blobsCount = await countBlobs(prisma, filters);

    return {
      totalBlobs: blobsCount,
    };
  });
