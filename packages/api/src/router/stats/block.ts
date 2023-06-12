import dayjs from "dayjs";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  STATS_PATH,
  datesProcedure,
  timeSeriesProcedure,
} from "../../utils/stats";

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
            dayId: z.date(),
            totalBlocks: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.blockDailyStats.findMany({
        select: {
          dayId: true,
          totalBlocks: true,
        },
        where: {
          dayId: { gte: timeFrame.initial.toDate() },
        },
      });
    }),
  backfillTimeSeriesStats: datesProcedure.mutation(async ({ ctx }) => {
    const prisma = ctx.prisma;
    const dates = ctx.dates;
    // TODO: implement some sort of bulk processing mechanism.

    // Delete all the rows if current date is set as target date
    if (!dates.from && dates.to && dayjs(dates.to).isSame(dayjs(), "day")) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BlockDailyStats"`);
    } else {
      await prisma.blockDailyStats.deleteMany({
        where: dates.buildWhereClause("dayId"),
      });
    }

    const whereClause = dates.buildRawWhereClause(Prisma.sql`timestamp`);

    const dailyBlockStats = await prisma.$queryRaw<
      Prisma.BlockDailyStatsCreateManyInput[]
    >`
        SELECT COUNT(id)::Int as "totalBlocks", DATE_TRUNC('day', timestamp) as "dayId"
        FROM "Block"
        ${whereClause}
        GROUP BY "dayId";
      `;

    return prisma.blockDailyStats.createMany({
      data: dailyBlockStats,
    });
  }),
});
