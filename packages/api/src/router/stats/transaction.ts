import dayjs from "dayjs";
import { z } from "zod";

import { Prisma } from "@blobscan/db";

import { createTRPCRouter, publicProcedure } from "../../trpc";
import {
  STATS_PATH,
  datesProcedure,
  timeSeriesProcedure,
} from "../../utils/stats";

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
    .output(z.object({ total: z.number(), updatedAt: z.date() }))
    .query(async ({ ctx }) => {
      const overallTransactionStats =
        await ctx.prisma.transactionOverallStats.findUnique({
          where: { id: 1 },
        });

      if (!overallTransactionStats) {
        return {
          total: 0,
          updatedAt: new Date(),
        };
      }

      return {
        total: overallTransactionStats.totalTransactions,
        updatedAt: overallTransactionStats.updatedAt,
      };
    }),
  getDailyStats: timeSeriesProcedure
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
        z
          .object({
            dayId: z.date(),
            totalTransactions: z.number(),
          })
          .optional(),
      ),
    )
    .query(({ ctx }) => {
      const timeFrame = ctx.timeFrame;

      return ctx.prisma.transactionDailyStats.findMany({
        select: {
          dayId: true,
          totalTransactions: true,
        },
        where: {
          dayId: {
            lte: timeFrame.final.toDate(),
            gte: timeFrame.initial.toDate(),
          },
        },
      });
    }),
  backfillDailyStats: datesProcedure.mutation(async ({ ctx }) => {
    const prisma = ctx.prisma;
    const dates = ctx.dates;

    // Delete all the rows if current date is set as target date
    if (!dates.from && dates.to && dayjs(dates.to).isSame(dayjs(), "day")) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "TransactionDailyStats"`);
    } else {
      await prisma.blockDailyStats.deleteMany({
        where: dates.buildWhereClause("dayId"),
      });
    }

    const whereClause = dates.buildRawWhereClause(Prisma.sql`timestamp`);

    const dailyTransactionStats = await prisma.$queryRaw<
      Prisma.TransactionDailyStatsCreateManyInput[]
    >`
        SELECT COUNT(id)::Int as "totalTransactions", DATE_TRUNC('day', timestamp) as "dayId"
        FROM "Transaction"
        ${whereClause}
        GROUP BY "dayId";
      `;

    return prisma.transactionDailyStats.createMany({
      data: dailyTransactionStats,
    });
  }),
});
