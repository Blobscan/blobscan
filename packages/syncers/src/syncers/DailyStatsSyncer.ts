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

        const rawLastDailyStatsDay = await prisma.dailyStats.findFirst({
          select: { day: true },
          where: { category: null, rollup: null },
          orderBy: { day: "desc" },
        });
        const lastDailyStatsDay = rawLastDailyStatsDay?.day
          ? normalizeDate(rawLastDailyStatsDay.day)
          : undefined;

        if (
          lastDailyStatsDay
            ? lastDailyStatsDay?.isSame(targetDay, "day")
            : false
        ) {
          this.logger.debug(`Skipping stats aggregation. Already up to date`);

          return;
        }

        const res = await prisma.dailyStats.aggregate({
          from: lastDailyStatsDay?.add(1, "day"),
          to: targetDay,
        });

        this.logger.info(
          `Daily data up to day ${formatDate(
            targetDay
          )} aggregated. ${res} daily stats created successfully.`
        );
      },
    });
  }
}
