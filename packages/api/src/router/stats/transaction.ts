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

function queryDailyTransactionStats(
  prisma: PrismaClient,
  datePeriod: DatePeriod = getDefaultDatePeriod(),
): Prisma.PrismaPromise<Prisma.TransactionDailyStatsCreateManyInput[]> {
  const dateField = Prisma.sql`timestamp`;
  const whereClause = buildRawWhereClause(dateField, datePeriod);

  return prisma.$queryRaw<Prisma.TransactionDailyStatsCreateManyInput[]>`
    SELECT
      DATE_TRUNC('day', ${dateField}) as "day",
      COUNT(id)::Int as "totalTransactions",
      COUNT(DISTINCT "from")::Int as "totalUniqueSenders",
      COUNT(DISTINCT "to")::Int as "totalUniqueReceivers"
    FROM "Transaction"
    ${whereClause}
    GROUP BY "day"
  `;
}

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
        .nullable(),
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
    .output(
      z.array(
        z.object({
          day: z.date(),
          totalTransactions: z.number(),
          totalUniqueSenders: z.number(),
          totalUniqueReceivers: z.number(),
        }),
      ),
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
      }),
    ),
  updateDailyStats: dateProcedure.mutation(
    async ({ ctx: { prisma, datePeriod } }) => {
      const [dailyTransactionStats] = await queryDailyTransactionStats(
        prisma,
        datePeriod,
      );

      if (!dailyTransactionStats) {
        return;
      }

      return prisma.transactionDailyStats.upsert({
        create: dailyTransactionStats,
        update: dailyTransactionStats,
        where: { day: datePeriod.to },
      });
    },
  ),
  backfillDailyStats: datePeriodProcedure.mutation(
    async ({ ctx: { prisma, datePeriod } }) => {
      // Delete all the rows if current date is set as target date
      if (!datePeriod) {
        await prisma.$executeRawUnsafe(
          `TRUNCATE TABLE "TransactionDailyStats"`,
        );
      } else {
        await prisma.transactionDailyStats.deleteMany({
          where: buildWhereClause("day", datePeriod),
        });
      }

      const dailyTransactionStats = await queryDailyTransactionStats(
        prisma,
        datePeriod,
      );

      return prisma.transactionDailyStats.createMany({
        data: dailyTransactionStats,
      });
    },
  ),
  backfillOverallStats: publicProcedure.mutation(
    async ({ ctx: { prisma } }) =>
      prisma.$executeRaw`
        INSERT INTO "TransactionOverallStats" (
          id,
          "totalTransactions",
          "totalUniqueReceivers",
          "totalUniqueSenders",
          "updatedAt"
        )
        SELECT
          1 as id,
          COUNT("id")::INT as "totalTransactions",
          COUNT(DISTINCT "to")::INT as "totalUniqueReceivers",
          COUNT(DISTINCT "from")::INT as "totalUniqueSenders",
          NOW() as "updatedAt"
        FROM "Transaction"
        ON CONFLICT(id) DO UPDATE SET
          "totalTransactions" = EXCLUDED."totalTransactions",
          "totalUniqueReceivers" = EXCLUDED."totalUniqueReceivers",
          "totalUniqueSenders" = EXCLUDED."totalUniqueSenders",
          "updatedAt" = EXCLUDED."updatedAt"
      `,
  ),
});
