import { z } from "@blobscan/zod";

import {
  withTimeFrame,
  withTimeFrameSchema,
} from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { TRANSACTION_BASE_PATH } from "./common";

const inputSchema = withTimeFrameSchema;

export const outputSchema = z.object({
  days: z.array(z.string()),
  totalTransactions: z.array(z.number()),
  totalUniqueSenders: z.array(z.number()),
  totalUniqueReceivers: z.array(z.number()),
  avgMaxBlobGasFees: z.array(z.number()),
});

type OutputSchema = z.infer<typeof outputSchema>;

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
    );
  });
