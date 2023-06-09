import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH, timeSeriesProcedure } from "../../utils/stats";

export const transactionStatsRouter = createTRPCRouter({
  getOverallStats: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/transaction/overall`,
        tags: ["stats", "transaction"],
        summary: "Get transaction overall stats",
      },
    })
    .input(z.void())
    .output(z.object({ total: z.number(), updatedAt: z.date() }))
    .query(async ({ ctx }) => {
      const overallTransactionStats =
        await ctx.prisma.transactionOverallStats.findUnique({
          where: { id: 1 },
        });

      if (!overallTransactionStats) {
        return {
          total: 0,
          updatedAt: new Date(),
        };
      }

      return {
        total: overallTransactionStats.totalTransactions,
        updatedAt: overallTransactionStats.updatedAt,
      };
    }),
  getTimeSeriesStats: timeSeriesProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/transaction`,
        tags: ["stats", "transaction"],
        summary: "Get transaction time series stats",
      },
    })
    .output(
      z.array(
        z
          .object({
            day: z.date(),
            totalTransactions: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.transactionDailyStats.findMany({
        select: {
          id: false,
          day: true,
          totalTransactions: true,
        },
        where: {
          day: { lte: timeFrame.final, gte: timeFrame.initial },
        },
      });
    }),
});
