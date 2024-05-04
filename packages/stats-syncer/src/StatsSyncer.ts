/* eslint-disable @typescript-eslint/no-misused-promises */
import type { Redis } from "ioredis";

import { ErrorException, StatsSyncerError } from "./errors";
import { logger } from "./logger";
import { DailyStatsUpdater } from "./updaters/DailyStatsUpdater";
import { OverallStatsUpdater } from "./updaters/OverallStatsUpdater";
import { createRedisConnection } from "./utils";

export type StatsSyncerOptions = {
  redisUri: string;
  lowestSlot?: number;
};

export class StatsSyncer {
  protected connection: Redis;
  protected dailyStatsUpdater: DailyStatsUpdater;
  protected overallStatsUpdater: OverallStatsUpdater;

  constructor({ redisUri, lowestSlot }: StatsSyncerOptions) {
    const connection = createRedisConnection(redisUri);

    connection.on("error", (err) => {
      logger.error(new ErrorException("The Redis connection failed", err));
    });

    this.connection = connection;
    this.dailyStatsUpdater = new DailyStatsUpdater(connection);
    this.overallStatsUpdater = new OverallStatsUpdater(connection, {
      lowestSlot,
    });
  }

  async start(config: {
    cronPatterns: {
      daily: string;
      overall: string;
    };
  }) {
    try {
      const cronPatterns = config.cronPatterns;

      await Promise.all([
        this.dailyStatsUpdater.start(cronPatterns.daily),
        this.overallStatsUpdater.start(cronPatterns.overall),
      ]);

      logger.info("Stats syncer started successfully.");
    } catch (err) {
      const err_ = new StatsSyncerError(
        "An error occurred when starting syncer",
        err
      );

      logger.error(err_);

      throw err_;
    }
  }

  async close() {
    try {
      await this.dailyStatsUpdater
        .close()
        .finally(() => this.overallStatsUpdater.close())
        .finally(() => {
          this.connection.removeAllListeners();

          if (this.connection.status === "ready") this.connection.disconnect();
        });

      logger.info("Stats syncer closed successfully.");
    } catch (err) {
      const err_ = new StatsSyncerError(
        "An error ocurred when closing syncer",
        err
      );

      logger.error(err_);

      throw err_;
    }
  }
}
