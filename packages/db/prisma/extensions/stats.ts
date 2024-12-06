import { Prisma } from "@prisma/client";
import { aggregateDailyStats, aggregateOverallStats } from "@prisma/client/sql";

import { MIN_DATE, toDailyDatePeriod } from "@blobscan/dayjs";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { BlockNumberRange, DatePeriodLike } from "../types";

const startExtensionFnSpan = curryPrismaExtensionFnSpan("stats");

const startDailyStatsModelFnSpan = startExtensionFnSpan("dailyStats");
const startOverallStatsModelFnSpan = startExtensionFnSpan("overallStats");

const MAX_INT = 2147483647;

export const statsExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "statsExtension",
    model: {
      dailyStats: {
        erase() {
          return startDailyStatsModelFnSpan("erase", () => {
            return prisma.$executeRawUnsafe("TRUNCATE TABLE daily_stats");
          });
        },
        aggregate(dailyDatePeriod?: DatePeriodLike) {
          const { from = MIN_DATE, to = new Date() } = dailyDatePeriod
            ? toDailyDatePeriod(dailyDatePeriod)
            : {};

          return prisma.$queryRawTyped(aggregateDailyStats(from, to));
        },
      },
      overallStats: {
        erase() {
          return startOverallStatsModelFnSpan("erase", () => {
            return prisma.$transaction([
              prisma.$executeRawUnsafe("TRUNCATE TABLE overall_stats"),
              prisma.blockchainSyncState.upsert({
                create: {
                  lastAggregatedBlock: 0,
                },
                update: {
                  lastAggregatedBlock: 0,
                },
                where: {
                  id: 1,
                },
              }),
            ]);
          });
        },
        async aggregate(
          opts: Partial<{
            blockRange: BlockNumberRange;
            overwrite: boolean;
          }> = {}
        ) {
          const { from = 0, to = MAX_INT } = opts.blockRange ?? {};
          const overwrite = opts.overwrite;

          if (overwrite) {
            await Prisma.getExtensionContext(this).erase();
          }

          await prisma.$transaction([
            prisma.$queryRawTyped(aggregateOverallStats(from, to)),
            prisma.blockchainSyncState.upsert({
              create: {
                lastAggregatedBlock: to,
              },
              update: {
                lastAggregatedBlock: to,
              },
              where: {
                id: 1,
              },
            }),
          ]);
        },
      },
    },
  })
);

export type StatsExtendedPrismaClient = ReturnType<typeof statsExtension>;
