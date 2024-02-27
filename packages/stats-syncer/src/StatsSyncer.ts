/* eslint-disable @typescript-eslint/no-misused-promises */
import dayjs from "dayjs";
import type { Redis } from "ioredis";

import { logger } from "@blobscan/logger";
import {
  daily as dailyCommand,
  gracefulShutdown as statsCommandsGracefulShutdown,
  overall as overallCommand,
} from "@blobscan/stats-aggregation-cli";

import { PeriodicUpdater } from "./PeriodicUpdater";
import { createRedisConnection } from "./utils";

export class StatsSyncer {
  protected connection: Redis;
  protected dailyStatsUpdater: PeriodicUpdater;
  protected overallStatsUpdater: PeriodicUpdater;

  constructor(redisUri: string) {
    const connection = createRedisConnection("Stats syncer", redisUri);

    this.dailyStatsUpdater = new PeriodicUpdater({
      name: "daily-stats-syncer",
      redisUriOrConnection: connection,
      updaterFn() {
        const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");

        return dailyCommand(["-f", yesterday, "-t", yesterday]);
      },
    });
    this.overallStatsUpdater = new PeriodicUpdater({
      name: "overall-stats-syncer",
      redisUriOrConnection: connection,
      updaterFn() {
        return overallCommand(["--to", "finalized"]);
      },
    });

    this.connection = connection;
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

      logger.debug("Stats syncer started successfully.");
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
        })
        .finally(() => statsCommandsGracefulShutdown());

      logger.debug("Stats syncer closed successfully.");
    } catch (err) {
      throw new Error(`Failed to close stats syncer: ${err}`);
    }
  }
}
