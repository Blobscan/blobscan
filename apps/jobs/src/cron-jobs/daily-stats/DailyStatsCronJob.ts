import { formatDate } from "../../utils";
import { BaseCronJob } from "../BaseCronJob";
import type { CommonCronJobConfig } from "../BaseCronJob";
import dailyStats from "./processor";
import type { DailyStatsJobResult } from "./types";

export type DailyStatsCronJobConfig = CommonCronJobConfig;

export class DailyStatsCronJob extends BaseCronJob {
  constructor({ redisUriOrConnection, cronPattern }: DailyStatsCronJobConfig) {
    const name = "daily-stats";

    super({
      name,
      redisUriOrConnection,
      cronPattern,
      processor: dailyStats,
    });

    this.worker?.on("completed", (_, result) => {
      const result_ = result as DailyStatsJobResult;

      if (!result_) {
        this.logger.info(
          "Daily stats aggregation skipped: no blocks indexed yet"
        );

        return;
      }

      const { fromDate, toDate, totalAggregationsCreated } = result_;

      if (fromDate === toDate) {
        this.logger.info(`Daily stats aggregation skipped: already up to date`);

        return;
      }

      this.logger.info(
        `Daily data up to day ${formatDate(
          toDate
        )} aggregated. ${totalAggregationsCreated} daily stats created successfully.`
      );
    });
  }
}
