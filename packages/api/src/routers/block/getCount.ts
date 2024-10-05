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
  totalBlocks: z.number(),
});

export async function countBlocks(
  prisma: BlobscanPrismaClient,
  filters: Filters
) {
  if (!hasCustomFilters(filters)) {
    const overallStats = await prisma.blockOverallStats.findFirst({
      select: {
        totalBlocks: true,
      },
    });

    return overallStats?.totalBlocks ?? 0;
  }

  const {
    transactionAddresses,
    transactionCategory,
    transactionRollup,
    blockNumber,
    blockSlot,
    blockType,
    blockTimestamp,
  } = filters;

  const txFiltersExists =
    transactionRollup !== undefined ||
    transactionAddresses ||
    transactionCategory;

  return prisma.block.count({
    where: {
      number: blockNumber,
      timestamp: blockTimestamp,
      transactionForks: blockType,
      slot: blockSlot,
      transactions: txFiltersExists
        ? {
            some: {
              category: filters.transactionCategory,
              rollup: filters.transactionRollup,
              OR: filters.transactionAddresses,
            },
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
    const blocksCount = await countBlocks(prisma, filters);

    return {
      totalBlocks: blocksCount,
    };
  });
