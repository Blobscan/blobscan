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
 * or using pre-calculated aggregated data from the daily or all-time
 * metrics to improve performance.
 *
 * The choice depends on the specificity of the filters provided.
 */
export async function countBlobs(
  prisma: BlobscanPrismaClient,
  rollupRegistry: RollupRegistry,
  filters: Filters
) {
  const { blockFilters = {}, transactionFilters, blockType } = filters;

  if (requiresDirectCount(filters, rollupRegistry)) {
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

  const where = buildStatsWhereClause(filters, rollupRegistry);

  // Get count by summing daily total blob metrics if a date range is provided in filters
  if (blockFilters.timestamp) {
    const dailyMetrics = await prisma.dailyMetrics.findMany({
      select: {
        totalBlobs: true,
      },
      where,
    });

    return dailyMetrics.reduce(
      (acc, { totalBlobs }) => acc + (totalBlobs ?? 0),
      0
    );
  }

  const allTimeMetrics = await prisma.allTimeMetrics.findMany({
    select: {
      totalBlobs: true,
    },
    where,
  });

  return allTimeMetrics.reduce(
    (acc, { totalBlobs }) => acc + (totalBlobs ?? 0),
    0
  );
}

export const getCount = publicProcedure
  .input(inputSchema)
  .use(withFilters)
  .output(outputSchema)
  .query(async ({ ctx: { filters, prisma, rollupRegistry } }) => {
    const blobsCount = await countBlobs(prisma, rollupRegistry, filters);

    return {
      totalBlobs: blobsCount,
    };
  });
