import { normalizeDate, toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { CronJob } from "../CronJob";
import type { CommonCronJobConfig } from "../CronJob";
import { formatDate } from "../utils";

export type DailyStatsCronJobConfig = CommonCronJobConfig;

export class DailyStatsCronJob extends CronJob {
  constructor({ redisUriOrConnection, cronPattern }: DailyStatsCronJobConfig) {
    const name = "daily-stats";

    super({
      name,
      redisUriOrConnection,
      cronPattern,
      jobFn: async () => {
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
