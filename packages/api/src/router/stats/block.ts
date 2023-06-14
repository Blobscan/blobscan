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

function queryDailyBlockStats(
  prisma: PrismaClient,
  datePeriod: DatePeriod,
): Prisma.PrismaPromise<Prisma.BlockDailyStatsCreateManyInput[]> {
  const dateField = Prisma.sql`timestamp`;
  const whereClause = buildRawWhereClause(dateField, datePeriod);

  return prisma.$queryRaw<Prisma.BlockDailyStatsCreateManyInput[]>`
    SELECT COUNT(id)::Int as "totalBlocks", DATE_TRUNC('day', ${dateField}) as "day"
    FROM "Block"
    ${whereClause}
    GROUP BY "day"
  `;
}

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
        }),
      ),
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
      }),
    ),
  updateDailyStats: dailyDateProcedure.mutation(
    async ({ ctx: { prisma, datePeriod } }) => {
      const [dailyBlockStats] = await queryDailyBlockStats(prisma, datePeriod);

      if (!dailyBlockStats) {
        return;
      }

      return prisma.blockDailyStats.upsert({
        create: dailyBlockStats,
        update: dailyBlockStats,
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
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "BlockDailyStats"`);
      } else {
        await prisma.blockDailyStats.deleteMany({
          where: buildWhereClause("day", datePeriod),
        });
      }

      const dailyBlockStats = await queryDailyBlockStats(prisma, datePeriod);

      return prisma.blockDailyStats.createMany({
        data: dailyBlockStats,
      });
    },
  ),
});
