import { z } from "zod";

import { timeFrameProcedure } from "../../middlewares/withTimeFrame";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH } from "../../utils/stats";

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
    .output(
      z
        .object({
          totalTransactions: z.number(),
          totalUniqueReceivers: z.number(),
          totalUniqueSenders: z.number(),
          updatedAt: z.date(),
        })
        .nullable()
    )
    .query(async ({ ctx }) => {
      const overallStats = await ctx.prisma.transactionOverallStats.findUnique({
        where: { id: 1 },
      });

      return overallStats;
    }),
  getDailyStats: timeFrameProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/transaction`,
        tags: ["stats", "transaction"],
        summary: "Get transaction time series stats",
      },
    })
    .input(
      z.object({
        totalTransactions: z.boolean().optional(),
        totalUniqueSenders: z.boolean().optional(),
        totalUniqueReceivers: z.boolean().optional(),
      })
    )
    .output(
      z.array(
        z.object({
          day: z.date(),
          totalTransactions: z.number(),
          totalUniqueSenders: z.number(),
          totalUniqueReceivers: z.number(),
        })
      )
    )
    .query(({ ctx: { prisma, timeFrame } }) =>
      prisma.transactionDailyStats.findMany({
        select: {
          day: true,
          totalTransactions: true,
          totalUniqueSenders: true,
          totalUniqueReceivers: true,
        },
        where: {
          day: {
            gte: timeFrame.initial.toDate(),
            lte: timeFrame.final.toDate(),
          },
        },
        orderBy: { day: "asc" },
      })
    ),
});
