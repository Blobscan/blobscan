import { z } from "@blobscan/zod";

import { publicProcedure } from "../../procedures";
import { timeSchema } from "../../utils/time-schema";
import { TRANSACTION_BASE_PATH } from "./common";

const inputSchema = timeSchema;

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
  .output(outputSchema)
  .query(async ({ ctx: { prisma }, input: { timeFrame } }) => {
    const stats = await prisma.dailyStats.findMany({
      where: {
        AND: [
          {
            day: {
              gte: timeFrame,
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
