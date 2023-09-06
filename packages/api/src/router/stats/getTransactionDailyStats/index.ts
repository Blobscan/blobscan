import { timeFrameProcedure } from "../../../middlewares/withTimeFrame";
import { TRANSACTION_BASE_PATH } from "../common";
import type { GetTransactionDailyStatsOutputSchema } from "./schema";
import { getTransactionDailyStatsOutputSchema } from "./schema";

export const getTransactionDailyStats = timeFrameProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${TRANSACTION_BASE_PATH}`,
      tags: ["transactions"],
      summary: "Get transactions time series stats",
    },
  })
  .output(getTransactionDailyStatsOutputSchema)
  .query(({ ctx: { prisma, timeFrame } }) =>
    prisma.transactionDailyStats
      .findMany({
        where: {
          day: {
            gte: timeFrame.initial.toDate(),
            lte: timeFrame.final.toDate(),
          },
        },
        orderBy: { day: "asc" },
      })
      .then((stats) =>
        stats.reduce<GetTransactionDailyStatsOutputSchema>(
          (
            outputStats,
            {
              avgMaxBlobGasFee,
              day,
              totalTransactions,
              totalUniqueReceivers,
              totalUniqueSenders,
            }
          ) => {
            outputStats.days.push(day.toISOString());
            outputStats.totalTransactions.push(totalTransactions);
            outputStats.totalUniqueSenders.push(totalUniqueSenders);
            outputStats.totalUniqueReceivers.push(totalUniqueReceivers);
            outputStats.avgMaxBlobGasFees.push(avgMaxBlobGasFee);

            return outputStats;
          },
          {
            avgMaxBlobGasFees: [],
            days: [],
            totalTransactions: [],
            totalUniqueSenders: [],
            totalUniqueReceivers: [],
          }
        )
      )
  );
