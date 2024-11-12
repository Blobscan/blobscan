import { Prisma } from "@prisma/client";
import {
  aggregateBlobDailyStats,
  aggregateBlobOverallStats,
  aggregateBlockDailyStats,
  aggregateTxDailyStats,
  aggregateTxOverallStats,
} from "@prisma/client/sql";

import { MIN_DATE, toDailyDatePeriod } from "@blobscan/dayjs";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { BlockNumberRange, DatePeriodLike } from "../types";

const startExtensionFnSpan = curryPrismaExtensionFnSpan("stats");

const startOverallStatsModelFnSpan = startExtensionFnSpan("overallStats");
const startBlobDailyStatsModelFnSpan = startExtensionFnSpan("blobDailyStats");
const startBlockDailyStatsModelFnSpan = startExtensionFnSpan("blockDailyStats");
const startTransactionDailyStatsModelFnSpan = startExtensionFnSpan(
  "transactionDailyStats"
);

const MAX_INT = 2147483647;

export const statsExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "statsExtension",
    model: {
      overallStats: {
        erase() {
          return startOverallStatsModelFnSpan("deleteAll", () => {
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
            prisma.$queryRawTyped(aggregateBlobOverallStats(from, to)),
            prisma.$queryRawTyped(aggregateTxOverallStats(from, to)),
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
      blobDailyStats: {
        deleteAll() {
          return startBlobDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe("TRUNCATE TABLE blob_daily_stats");
          });
        },
        populate(dailyDatePeriod?: DatePeriodLike) {
          const { from: from = MIN_DATE, to: to = new Date() } = dailyDatePeriod
            ? toDailyDatePeriod(dailyDatePeriod)
            : {};

          return prisma.$queryRawTyped(aggregateBlobDailyStats(from, to));
        },
      },
      blockDailyStats: {
        deleteAll() {
          return startBlockDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe(`TRUNCATE TABLE block_daily_stats`);
          });
        },
        populate(dailyDatePeriod?: DatePeriodLike) {
          const { from: from = MIN_DATE, to: to = new Date() } = dailyDatePeriod
            ? toDailyDatePeriod(dailyDatePeriod)
            : {};

          return prisma.$queryRawTyped(aggregateBlockDailyStats(from, to));
        },
      },
      transactionDailyStats: {
        deleteAll() {
          return startTransactionDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe(
              `TRUNCATE TABLE transaction_daily_stats`
            );
          });
        },
        async populate(dailyDatePeriod?: DatePeriodLike) {
          const { from: from = MIN_DATE, to: to = new Date() } = dailyDatePeriod
            ? toDailyDatePeriod(dailyDatePeriod)
            : {};

          return prisma.$queryRawTyped(aggregateTxDailyStats(from, to));
        },
      },
    },
  })
);

export type StatsExtendedPrismaClient = ReturnType<typeof statsExtension>;
