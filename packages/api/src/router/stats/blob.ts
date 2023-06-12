import dayjs from "dayjs";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  STATS_PATH,
  datesProcedure,
  timeSeriesProcedure,
} from "../../utils/stats";

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
  getDailyStats: timeSeriesProcedure
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
          day: true,
          totalBlobs: true,
        },
        where: {
          day: {
            lte: timeFrame.final.toDate(),
            gte: timeFrame.initial.toDate(),
          },
        },
      });
    }),
  backfillDailyStats: datesProcedure.mutation(async ({ ctx }) => {
    const prisma = ctx.prisma;
    const dates = ctx.dates;
    // TODO: implement some sort of bulk processing mechanism.

    // Delete all the rows if current date is set as target date
    if (!dates.from && dates.to && dayjs(dates.to).isSame(dayjs(), "day")) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BlobDailyStats"`);
    } else {
      await prisma.blockDailyStats.deleteMany({
        where: dates.buildWhereClause("day"),
      });
    }

    const whereClause = dates.buildRawWhereClause(Prisma.sql`timestamp`);

    const dailyBlobStats = await prisma.$queryRaw<
      Prisma.BlobDailyStatsCreateManyInput[]
    >`
          SELECT COUNT(id)::Int as "totalBlobs", DATE_TRUNC('day', timestamp) as "day"
          FROM "Blob"
          ${whereClause}
          GROUP BY "day";
        `;

    return prisma.blobDailyStats.createMany({
      data: dailyBlobStats,
    });
  }),
});
