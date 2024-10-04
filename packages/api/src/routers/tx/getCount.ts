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
  totalTransactions: z.number(),
});

export async function countTxs(prisma: BlobscanPrismaClient, filters: Filters) {
  if (!hasCustomFilters(filters)) {
    const overallStats = await prisma.transactionOverallStats.findFirst({
      select: {
        totalTransactions: true,
      },
      where: {
        AND: [{ category: null }, { rollup: null }],
      },
    });

    return overallStats?.totalTransactions ?? 0;
  }

  const {
    blockNumber,
    blockTimestamp,
    transactionAddresses,
    transactionCategory,
    transactionRollup,
    blockSlot,
    blockType,
  } = filters;

  const blockFiltersExists = blockSlot || blockType;

  return prisma.transaction.count({
    where: {
      blockNumber: blockNumber,
      blockTimestamp: blockTimestamp,
      category: transactionCategory,
      rollup: transactionRollup,
      OR: transactionAddresses,
      block: blockFiltersExists
        ? {
            slot: blockSlot,
            transactionForks: blockType,
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
    const txsCount = await countTxs(prisma, filters);

    return {
      totalTransactions: txsCount,
    };
  });
