/* eslint-disable @typescript-eslint/no-misused-promises */
import type { Redis } from "ioredis";

import { DailyStatsUpdater } from "./updaters/DailyStatsUpdater";
import { OverallStatsUpdater } from "./updaters/OverallStatsUpdater";
import { createRedisConnection, log } from "./utils";

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
      log("error", `Redis connection error: ${err}`);
    });

    this.connection = connection;
    this.dailyStatsUpdater = new DailyStatsUpdater(connection);
    this.overallStatsUpdater = new OverallStatsUpdater(connection, {
      lowestSlot,
    });
  }

  async run(config: {
    cronPatterns: {
      daily: string;
      overall: string;
    };
  }) {
    try {
      const cronPatterns = config.cronPatterns;

      await Promise.all([
        this.dailyStatsUpdater.run(cronPatterns.daily),
        this.overallStatsUpdater.run(cronPatterns.overall),
      ]);

      log("debug", "Syncer started successfully.");
    } catch (err) {
      throw new Error(`Failed to run stats syncer: ${err}`);
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

      log("debug", "Syncer closed successfully.");
    } catch (err) {
      throw new Error(`Failed to close stats syncer: ${err}`);
    }
  }
}
