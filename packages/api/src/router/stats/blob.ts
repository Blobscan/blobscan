import { z } from "zod";

import { timeFrameProcedure } from "../../middlewares/withTimeFrame";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH } from "../../utils/stats";

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
    .output(
      z.object({
        totalBlobs: z.number(),
        totalUniqueBlobs: z.number(),
        totalBlobSize: z.bigint(),
        avgBlobSize: z.number(),
        updatedAt: z.date(),
      }),
    )
    .query(async ({ ctx: { prisma } }) => {
      const overallBlobStats = await prisma.blobOverallStats.findUnique({
        where: { id: 1 },
      });

      if (!overallBlobStats) {
        return {
          totalBlobs: 0,
          avgBlobSize: 0,
          totalBlobSize: BigInt(0),
          totalUniqueBlobs: 0,
          updatedAt: new Date(),
        };
      }

      return overallBlobStats;
    }),
  getDailyStats: timeFrameProcedure
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
        z.object({
          day: z.date(),
          totalBlobs: z.number(),
          totalUniqueBlobs: z.number(),
          totalBlobSize: z.bigint(),
          avgBlobSize: z.number(),
        }),
      ),
    )
    .query(({ ctx: { prisma, timeFrame } }) =>
      prisma.blobDailyStats.findMany({
        select: {
          day: true,
          totalBlobs: true,
          totalUniqueBlobs: true,
          totalBlobSize: true,
          avgBlobSize: true,
        },
        where: {
          day: {
            gte: timeFrame.initial.toDate(),
            lte: timeFrame.final.toDate(),
          },
        },
        orderBy: { day: "asc" },
      }),
    ),
});
