import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH, timeSeriesProcedure } from "../../utils/stats";

export const blockStatsRouter = createTRPCRouter({
  getOverallStats: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/block/overall`,
        tags: ["stats", "block"],
        summary: "Get block overall stats",
      },
    })
    .input(z.void())
    .output(z.object({ total: z.number(), updatedAt: z.date() }))
    .query(async ({ ctx }) => {
      const overallBlockStats = await ctx.prisma.blockOverallStats.findUnique({
        where: { id: 1 },
      });

      if (!overallBlockStats) {
        return {
          total: 0,
          updatedAt: new Date(),
        };
      }

      return {
        total: overallBlockStats.totalBlocks,
        updatedAt: overallBlockStats.updatedAt,
      };
    }),
  getTimeSeriesStats: timeSeriesProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/block`,
        tags: ["stats", "block"],
        summary: "Get block time series stats",
      },
    })
    .output(
      z.array(
        z
          .object({
            day: z.date(),
            totalBlocks: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.blockDailyStats.findMany({
        select: {
          id: false,
          day: true,
          totalBlocks: true,
        },
        where: {
          day: { gte: timeFrame.initial },
        },
      });
    }),
});
