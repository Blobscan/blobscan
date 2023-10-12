import type { TRPCContext } from "../../context";
import { publicProcedure } from "../../procedures";
import { TRANSACTION_BASE_PATH } from "./common";
import {
  getTransactionOverallStatsInputSchema,
  getTransactionOverallStatsOutputSchema,
} from "./getTransactionOverallStats.schema";

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
      tags: ["transactions"],
      summary: "Get transactions overall stats",
    },
  })
  .input(getTransactionOverallStatsInputSchema)
  .output(getTransactionOverallStatsOutputSchema)
  .query(({ ctx }) => getTransactionOverallStatsQuery(ctx.prisma));
