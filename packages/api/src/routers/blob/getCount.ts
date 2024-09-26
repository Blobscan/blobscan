import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { Filters } from "../../middlewares/withFilters";
import {
  hasCustomFilters,
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";

const inputSchema = withAllFiltersSchema;

const outputSchema = z.object({
  totalBlobs: z.number(),
});

export async function countBlobs(
  prisma: BlobscanPrismaClient,
  filters: Filters
) {
  if (!hasCustomFilters(filters)) {
    const overallStats = await prisma.blobOverallStats.findFirst({
      select: {
        totalBlobs: true,
      },
    });

    return overallStats?.totalBlobs ?? 0;
  }

  const {
    transactionAddresses,
    transactionCategory,
    transactionRollup,
    blockSlot,
    blockType,
  } = filters;

  const txFiltersExists =
    transactionRollup !== undefined ||
    transactionAddresses ||
    transactionCategory;
  const blockFiltersExists = blockSlot || blockType;

  return prisma.blobsOnTransactions.count({
    where: {
      blockNumber: filters.blockNumber,
      blockTimestamp: filters.blockTimestamp,
      block: blockFiltersExists
        ? {
            slot: filters.blockSlot,
            transactionForks: filters.blockType,
          }
        : undefined,
      transaction: txFiltersExists
        ? {
            category: filters.transactionCategory,
            rollup: filters.transactionRollup,
            OR: filters.transactionAddresses,
          }
        : undefined,
    },
  });
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
