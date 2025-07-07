import { BaseCronJob } from "../BaseCronJob";
import type { CommonCronJobConfig } from "../BaseCronJob";
import overallStats from "./processor";
import type { OverallStatsJobResult } from "./types";

export interface OverallStatsCronJobConfig extends CommonCronJobConfig {
  forkSlot: number;
  batchSize?: number;
}

export class OverallStatsCronJob extends BaseCronJob {
  constructor({
    cronPattern,
    redisUriOrConnection,
    forkSlot,
    batchSize,
  }: OverallStatsCronJobConfig) {
    const name = "overall-stats";
    super({
      name,
      cronPattern,
      redisUriOrConnection,
      processor: overallStats,
      jobData: {
        forkSlot,
        batchSize,
      },
    });

    this.worker?.on("completed", (_, result) => {
      const result_ = result as OverallStatsJobResult;

      if (!result_) {
        this.logger.debug(
          "Stats aggregation skipped: chain hasn't been fully indexed yet"
        );

        return;
      }

      const { fromBlock, toBlock } = result_;

      if (fromBlock >= toBlock) {
        this.logger.debug(
          `Stats aggregation skipped: no new finalized blocks (last aggregated block: ${
            fromBlock - 1
          })`
        );

        return;
      }

      this.logger.info(
        `Data from block ${fromBlock.toLocaleString()} up to ${toBlock.toLocaleString()} aggregated successfully.`
      );
    });
  }
}
