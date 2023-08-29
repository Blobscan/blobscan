import { z } from "zod";

import "../../middlewares/withDates";
import { timeFrameProcedure } from "../../middlewares/withTimeFrame";
import { publicProcedure } from "../../procedures";
import { createTRPCRouter } from "../../trpc";
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
      z.object({
        totalBlocks: z.number(),
        totalBlobGasUsed: z.bigint(),
        totalBlobAsCalldataGasUsed: z.bigint(),
        totalBlobFee: z.bigint(),
        totalBlobAsCalldataFee: z.bigint(),
        avgBlobFee: z.number(),
        avgBlobAsCalldataFee: z.number(),
        avgBlobGasPrice: z.number(),
        updatedAt: z.date(),
      })
    )
    .query(async ({ ctx: { prisma } }) => {
      const overallStats = await prisma.blockOverallStats.findUnique({
        where: { id: 1 },
      });

      return (
        overallStats ?? {
          totalBlocks: 0,
          totalBlobGasUsed: BigInt(0),
          totalBlobAsCalldataGasUsed: BigInt(0),
          totalBlobFee: BigInt(0),
          totalBlobAsCalldataFee: BigInt(0),
          avgBlobFee: 0,
          avgBlobAsCalldataFee: 0,
          avgBlobGasPrice: 0,
          updatedAt: new Date(),
        }
      );
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
          day: z.string(),
          totalBlocks: z.number(),
          totalBlobGasUsed: z.number(),
          totalBlobAsCalldataGasUsed: z.number(),
          totalBlobFee: z.number(),
          totalBlobAsCalldataFee: z.number(),
          avgBlobFee: z.number(),
          avgBlobAsCalldataFee: z.number(),
          avgBlobGasPrice: z.number(),
        })
      )
    )
    .query(({ ctx: { prisma, timeFrame } }) =>
      prisma.blockDailyStats
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
          stats.map((stat) => ({
            ...stat,
            day: stat.day.toISOString(),
          }))
        )
    ),
});
