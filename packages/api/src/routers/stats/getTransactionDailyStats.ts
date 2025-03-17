import { DailyStatsModel } from "@blobscan/db/prisma/zod";
import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { serialize } from "../../utils";
import { TRANSACTION_BASE_PATH } from "./common";

const inputSchema = withTimeFrameSchema;

const dailyStatsReponse = z.object({
  days: DailyStatsModel.shape.day.array(),
  totalTransactions: DailyStatsModel.shape.totalTransactions.array(),
  totalUniqueSenders: DailyStatsModel.shape.totalUniqueSenders.array(),
  totalUniqueReceivers: DailyStatsModel.shape.totalUniqueReceivers.array(),
  avgMaxBlobGasFees: DailyStatsModel.shape.avgMaxBlobGasFee.array(),
});

export const outputSchema = dailyStatsReponse.transform(serialize);

type OutputSchema = z.input<typeof outputSchema>;

export const getTransactionDailyStats = publicProcedure
  .meta({
    openapi: {
      method: "GET",
      path: `/${TRANSACTION_BASE_PATH}`,
      tags: ["stats"],
      summary: "retrieves transactions time series stats.",
    },
  })
  .input(inputSchema)
  .use(withTimeFrame)
  .output(outputSchema)
  .query(async ({ ctx: { prisma, timeFrame } }) => {
    const stats = await prisma.dailyStats.findMany({
      where: {
        AND: [
          {
            day: {
              gte: timeFrame.initial.toDate(),
              lte: timeFrame.final.toDate(),
            },
          },
          {
            category: null,
          },
          {
            rollup: null,
          },
        ],
      },
      orderBy: { day: "asc" },
    });

    return stats.reduce<OutputSchema>(
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
        outputStats.days.push(day);
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
    );
  });
