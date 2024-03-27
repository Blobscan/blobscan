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

export function getTransactionOverallStatsQuery(prisma: TRPCContext["prisma"]) {
  return prisma.transactionOverallStats
    .findUnique({
      where: { id: 1 },
    })
    .then(
      (overallStats) =>
        overallStats ?? {
          totalTransactions: 0,
          totalUniqueReceivers: 0,
          totalUniqueSenders: 0,
          avgMaxBlobGasFee: 0,
          updatedAt: new Date(),
        }
    );
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
