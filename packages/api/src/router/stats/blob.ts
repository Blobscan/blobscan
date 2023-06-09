import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH, timeSeriesProcedure } from "../../utils/stats";

export const blobStatsRouter = createTRPCRouter({
  getOverallStats: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/blob/overall`,
        tags: ["stats", "blob"],
        summary: "Get blob overall stats",
      },
    })
    .input(z.void())
    .output(z.object({ totalBlobs: z.number(), updatedAt: z.date() }))
    .query(async ({ ctx }) => {
      const overallBlobStats = await ctx.prisma.blobOverallStats.findUnique({
        where: { id: 1 },
      });

      if (!overallBlobStats) {
        return {
          totalBlobs: 0,
          updatedAt: new Date(),
        };
      }

      return {
        totalBlobs: overallBlobStats.totalBlobs,
        updatedAt: overallBlobStats.updatedAt,
      };
    }),
  getTimeSeriesStats: timeSeriesProcedure
    .meta({
      openapi: {
        method: "GET",
        path: `${STATS_PATH}/blob`,
        tags: ["stats", "blob"],
        summary: "Get blob time series stats",
      },
    })
    .output(
      z.array(
        z
          .object({
            day: z.date(),
            totalBlobs: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.blobDailyStats.findMany({
        select: {
          id: false,
          day: true,
          totalBlobs: true,
        },
        where: {
          day: { lte: timeFrame.final, gte: timeFrame.initial },
        },
      });
    }),
});
