import { z } from "zod";

import "../../middlewares/withDates";
import { timeFrameProcedure } from "../../middlewares/withTimeFrame";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import { STATS_PATH } from "../../utils/stats";

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
    .output(
      z.object({ totalBlocks: z.number(), updatedAt: z.date() }).nullable()
    )
    .query(async ({ ctx: { prisma } }) => {
      const overallBlockStats = await prisma.blockOverallStats.findUnique({
        where: { id: 1 },
      });

      return overallBlockStats;
    }),
  getDailyStats: timeFrameProcedure
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
        z.object({
          day: z.date(),
          totalBlocks: z.number(),
        })
      )
    )
    .query(({ ctx: { prisma, timeFrame } }) =>
      prisma.blockDailyStats.findMany({
        select: {
          day: true,
          totalBlocks: true,
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
