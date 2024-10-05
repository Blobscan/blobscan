import { z } from "@blobscan/zod";

import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { TRANSACTION_BASE_PATH } from "./common";

export const inputSchema = z.void();

export const outputSchema = z.object({
  totalTransactions: z.number(),
  totalUniqueReceivers: z.number(),
  totalUniqueSenders: z.number(),
  avgMaxBlobGasFee: z.number(),
  updatedAt: z.date(),
});

export async function getTransactionOverallStatsQuery(
  prisma: TRPCContext["prisma"]
) {
  const stats = await prisma.transactionOverallStats.findMany({
    where: {
      category: null,
      rollup: null,
    },
  });

  const allStats = stats[0];

  if (!allStats) {
    return {
      totalTransactions: 0,
      totalUniqueReceivers: 0,
      totalUniqueSenders: 0,
      avgMaxBlobGasFee: 0,
      updatedAt: new Date(),
    };
  }

  return {
    totalTransactions: allStats.totalTransactions,
    totalUniqueReceivers: allStats.totalUniqueReceivers,
    totalUniqueSenders: allStats.totalUniqueSenders,
    avgMaxBlobGasFee: allStats.avgMaxBlobGasFee,
    updatedAt: allStats.updatedAt,
  };
}

export const getTransactionOverallStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${TRANSACTION_BASE_PATH}/overall`,
      tags: ["stats"],
      summary: "retrieves transactions overall stats.",
    },
  })
  .input(inputSchema)
  .output(outputSchema)
  .query(({ ctx }) => getTransactionOverallStatsQuery(ctx.prisma));
