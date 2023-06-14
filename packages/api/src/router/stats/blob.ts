import dayjs from "dayjs";
import { z } from "zod";

import { Prisma, type PrismaClient } from "@blobscan/db";

import {
  dailyDateProcedure,
  datePeriodProcedure,
} from "../../middlewares/withDates";
import { timeFrameProcedure } from "../../middlewares/withTimeFrame";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  buildRawWhereClause,
  buildWhereClause,
  type DatePeriod,
} from "../../utils/dates";
import { STATS_PATH } from "../../utils/stats";

function queryDailyBlobStats(
  prisma: PrismaClient,
  datePeriod: DatePeriod,
): Prisma.PrismaPromise<Prisma.BlobDailyStatsCreateManyInput[]> {
  const dateField = Prisma.sql`timestamp`;
  const whereClause = buildRawWhereClause(dateField, datePeriod);

  return prisma.$queryRaw<Prisma.BlobDailyStatsCreateManyInput[]>`
    SELECT 
      DATE_TRUNC('day', ${dateField}) as "day",
      COUNT(id)::Int as "totalBlobs",
      COUNT(DISTINCT "versionedHash")::Int as "totalUniqueBlobs",
      SUM(size) as "totalBlobSize",
      AVG(size)::FLOAT as "avgBlobSize"
    FROM "Blob"
    ${whereClause}
    GROUP BY "day"
  `;
}

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
        z
          .object({
            day: z.date(),
            totalBlobs: z.number(),
            totalUniqueBlobs: z.number(),
            totalBlobSize: z.bigint(),
            avgBlobSize: z.number(),
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
      });
    }),
  updateDailyStats: dailyDateProcedure.mutation(
    async ({ ctx: { prisma, datePeriod } }) => {
      const [dailyBlobStats] = await queryDailyBlobStats(prisma, datePeriod);

      if (!dailyBlobStats) {
        return;
      }

      return prisma.blobDailyStats.upsert({
        create: dailyBlobStats,
        update: dailyBlobStats,
        where: { day: datePeriod.to },
      });
    },
  ),
  backfillDailyStats: datePeriodProcedure.mutation(
    async ({ ctx: { prisma, datePeriod } }) => {
      // TODO: implement some sort of bulk processing mechanism.

      // Delete all the rows if current date is set as target date
      if (
        !datePeriod.from &&
        datePeriod.to &&
        dayjs(datePeriod.to).isSame(dayjs(), "day")
      ) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BlobDailyStats"`);
      } else {
        await prisma.blockDailyStats.deleteMany({
          where: buildWhereClause("day", datePeriod),
        });
      }

      const dailyBlobStats = await queryDailyBlobStats(prisma, datePeriod);

      return prisma.blobDailyStats.createMany({
        data: dailyBlobStats,
      });
    },
  ),
});
