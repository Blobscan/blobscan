import { Prisma } from "@prisma/client";
import {
  aggregateBlobDailyStats,
  aggregateBlobOverallStats,
  aggregateBlockDailyStats,
  aggregateBlockOverallStats,
  aggregateTxDailyStats,
  aggregateTxOverallStats,
} from "@prisma/client/sql";

import { toDailyDatePeriod } from "@blobscan/dayjs";

import { curryPrismaExtensionFnSpan } from "../instrumentation";
import type { BlockNumberRange, DatePeriodLike } from "../types";

const startExtensionFnSpan = curryPrismaExtensionFnSpan("stats");

const startBlobDailyStatsModelFnSpan = startExtensionFnSpan("blobDailyStats");
const startBlockDailyStatsModelFnSpan = startExtensionFnSpan("blockDailyStats");
const startTransactionDailyStatsModelFnSpan = startExtensionFnSpan(
  "transactionDailyStats"
);

export const statsExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "statsExtension",
    model: {
      blobDailyStats: {
        deleteAll() {
          return startBlobDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe("TRUNCATE TABLE blob_daily_stats");
          });
        },
        populate(dailyDatePeriod?: DatePeriodLike) {
          const { from, to } = toDailyDatePeriod(dailyDatePeriod);

          return prisma.$queryRawTyped(aggregateBlobDailyStats(from, to));
        },
      },
      blobOverallStats: {
        async populate() {
          await prisma.blobOverallStats.deleteMany();

          return prisma.$queryRawTyped(
            aggregateBlobOverallStats(0, Number.MAX_SAFE_INTEGER)
          );
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$queryRawTyped(aggregateBlobOverallStats(from, to));
        },
      },
      blockDailyStats: {
        deleteAll() {
          return startBlockDailyStatsModelFnSpan("deleteAll", () => {
            return prisma.$executeRawUnsafe(`TRUNCATE TABLE block_daily_stats`);
          });
        },
        populate(dailyDatePeriod?: DatePeriodLike) {
          const { from, to } = toDailyDatePeriod(dailyDatePeriod);

          return prisma.$queryRawTyped(aggregateBlockDailyStats(from, to));
        },
      },
      blockOverallStats: {
        async populate() {
          await prisma.blockOverallStats.deleteMany();

          return prisma.$queryRawTyped(
            aggregateBlockOverallStats(0, Number.MAX_SAFE_INTEGER)
          );
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$queryRawTyped(aggregateBlockOverallStats(from, to));
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
          const { from, to } = toDailyDatePeriod(dailyDatePeriod);

          return prisma.$queryRawTyped(aggregateTxDailyStats(from, to));
        },
      },
      transactionOverallStats: {
        async populate() {
          await prisma.transactionOverallStats.deleteMany();

          return prisma.$queryRawTyped(
            aggregateTxOverallStats(0, Number.MAX_SAFE_INTEGER)
          );
        },
        increment({ from, to }: BlockNumberRange) {
          return prisma.$queryRawTyped(aggregateTxOverallStats(from, to));
        },
      },
    },
  })
);

export type StatsExtendedPrismaClient = ReturnType<typeof statsExtension>;
