import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { Filters } from "../../middlewares/withFilters";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { normalize } from "../../utils";
import { buildStatsWhereClause, requiresDirectCount } from "../../utils/count";

const inputSchema = withAllFiltersSchema;

const outputSchema = z
  .object({
    totalBlobs: z.number(),
  })
  .transform(normalize);

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
  const { blockFilters = {}, transactionFilters, blockType } = filters;

  if (requiresDirectCount(filters)) {
    return prisma.blobsOnTransactions.count({
      where: {
        blockNumber: blockFilters.number,
        blockTimestamp: blockFilters.timestamp,
        block: {
          slot: blockFilters.slot,
          transactionForks: blockType,
        },
        transaction: transactionFilters,
      },
    });
  }

  const where = buildStatsWhereClause(filters);

  // Get count by summing daily total transaction stats data if a date range is provided in filters
  if (blockFilters.timestamp) {
    const dailyStats = await prisma.dailyStats.findMany({
      select: {
        totalBlobs: true,
      },
      where,
    });

    return dailyStats.reduce((acc, { totalBlobs }) => acc + totalBlobs, 0);
  }

  const overallStats = await prisma.overallStats.findMany({
    select: {
      totalBlobs: true,
    },
    where,
  });

  return overallStats.reduce((acc, { totalBlobs }) => acc + totalBlobs, 0);
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
