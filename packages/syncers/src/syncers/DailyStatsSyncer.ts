import { normalizeDate, toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { BaseSyncer } from "../BaseSyncer";
import type { CommonSyncerConfig } from "../BaseSyncer";
import { formatDate } from "../utils";

export type DailyStatsSyncerConfig = CommonSyncerConfig;

export class DailyStatsSyncer extends BaseSyncer {
  constructor({ redisUriOrConnection, cronPattern }: DailyStatsSyncerConfig) {
    const name = "daily-stats";

    super({
      name,
      redisUriOrConnection,
      cronPattern,
      syncerFn: async () => {
        const lastIndexedBlock = await prisma.block.findLatest();

        if (!lastIndexedBlock) {
          this.logger.debug(
            "Skipping stats aggregation. No blocks indexed yet"
          );

          return;
        }
        const targetDate = normalizeDate(lastIndexedBlock.timestamp).subtract(
          1,
          "day"
        );
        const targetDay = toDailyDate(targetDate);

        const [lastBlobStatsDay, lastBlockStatsDay, lastTxStatsDay] =
          await Promise.all([
            prisma.blobDailyStats.findFirst({
              select: { day: true },
              where: { category: null, rollup: null },
              orderBy: { day: "desc" },
            }),
            prisma.blockDailyStats.findFirst({
              select: { day: true },
              orderBy: { day: "desc" },
            }),
            prisma.transactionDailyStats.findFirst({
              select: { day: true },
              where: { category: null, rollup: null },
              orderBy: { day: "desc" },
            }),
          ]).then((stats) =>
            stats.map((stat) =>
              stat?.day ? normalizeDate(stat.day) : undefined
            )
          );

        if (
          [lastBlobStatsDay, lastBlockStatsDay, lastTxStatsDay].every(
            (lastStatsDay) =>
              lastStatsDay ? lastStatsDay?.isSame(targetDay, "day") : false
          )
        ) {
          this.logger.debug(`Skipping stats aggregation. Already up to date`);

          return;
        }

        const entityToPopulatedDays = await Promise.all([
          prisma.blobDailyStats.populate({
            from: lastBlobStatsDay?.add(1, "day"),
            to: targetDay,
          }),
          prisma.blockDailyStats.populate({
            from: lastBlockStatsDay?.add(1, "day"),
            to: targetDay,
          }),
          prisma.transactionDailyStats.populate({
            from: lastTxStatsDay?.add(1, "day"),
            to: targetDay,
          }),
        ]);

        const results = entityToPopulatedDays
          .map(
            ([entity, populatedDays]) =>
              `${populatedDays} ${entity} daily stats created`
          )
          .join(", ");

        this.logger.info(
          `Daily data up to day ${formatDate(
            targetDay
          )} aggregated. ${results} successfully.`
        );
      },
    });
  }
}
