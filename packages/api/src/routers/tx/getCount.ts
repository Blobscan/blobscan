import type { BlobscanPrismaClient } from "@blobscan/db";
import { z } from "@blobscan/zod";

import type { Filters } from "../../middlewares/withFilters";
import {
  withAllFiltersSchema,
  withFilters,
} from "../../middlewares/withFilters";
import { publicProcedure } from "../../procedures";
import { buildCountStatsFilters, hasToPerformCount } from "../../utils/count";

const inputSchema = withAllFiltersSchema;

const outputSchema = z.object({
  totalTransactions: z.number(),
});

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

  if (hasToPerformCount(filters)) {
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

  const { category, rollup, fromDay, toDay } = buildCountStatsFilters(filters);

  if (fromDay || toDay) {
    const dailyStats = await prisma.transactionDailyStats.findMany({
      select: {
        totalTransactions: true,
      },
      where: {
        AND: [{ category }, { rollup }, { day: { gte: fromDay, lt: toDay } }],
      },
    });

    return dailyStats.reduce(
      (acc, { totalTransactions }) => acc + totalTransactions,
      0
    );
  }

  const overallStats = await prisma.transactionOverallStats.findFirst({
    select: {
      totalTransactions: true,
    },
    where: {
      AND: [{ category }, { rollup }],
    },
  });

  return overallStats?.totalTransactions ?? 0;
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
