import { z } from "zod";

import { Prisma, type PrismaClient } from "@blobscan/db";

import {
  datePeriodProcedure,
  dateProcedure,
} from "../../middlewares/withDates";
import { timeFrameProcedure } from "../../middlewares/withTimeFrame";
import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  buildRawWhereClause,
  buildWhereClause,
  getDefaultDatePeriod,
  type DatePeriod,
} from "../../utils/dates";
import { STATS_PATH } from "../../utils/stats";

function queryDailyBlobStats(
  prisma: PrismaClient,
  datePeriod: DatePeriod = getDefaultDatePeriod(),
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
        orderBy: { day: "asc" },
      });
    }),
  updateDailyStats: dateProcedure.mutation(
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
      if (!datePeriod) {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BlobDailyStats"`);
      } else {
        await prisma.blobDailyStats.deleteMany({
          where: buildWhereClause("day", datePeriod),
        });
      }

      const dailyBlobStats = await queryDailyBlobStats(prisma, datePeriod);

      return prisma.blobDailyStats.createMany({
        data: dailyBlobStats,
      });
    },
  ),
  backfillOverallStats: publicProcedure.mutation(
    async ({ ctx: { prisma } }) =>
      prisma.$executeRaw`
        INSERT INTO "BlobOverallStats" (
          id,
          "totalBlobs",
          "totalUniqueBlobs",
          "totalBlobSize",
          "avgBlobSize",
          "updatedAt"
        )
        SELECT
          1 as id,
          COUNT("versionedHash")::INT as "totalBlobs",
          COUNT(DISTINCT "versionedHash")::INT as "totalUniqueBlobs",
          SUM(size) as "totalBlobSize",
          AVG(size)::FLOAT as "avgBlobSize",
          NOW() as "updatedAt"
        FROM "Blob"
        ON CONFLICT(id) DO UPDATE SET
          "totalBlobs" = EXCLUDED."totalBlobs",
          "totalUniqueBlobs" = EXCLUDED."totalUniqueBlobs",
          "totalBlobSize" = EXCLUDED."totalBlobSize",
          "avgBlobSize" = EXCLUDED."avgBlobSize",
          "updatedAt" = EXCLUDED."updatedAt"
      `,
  ),
});
