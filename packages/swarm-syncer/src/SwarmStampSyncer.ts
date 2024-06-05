 
import type { Redis } from "ioredis";

import { ErrorException, SwarmStampSyncerError } from "./errors";
import { logger } from "./logger";
import { SwarmStampUpdater } from "./updaters/SwarmUpdater";
import { createRedisConnection } from "./utils";

export type SwarmStampSyncerOptions = {
  redisUri: string;
  beeEndpoint: string;
};

export class SwarmStampSyncer {
  protected connection: Redis;
  protected swarmUpdater: SwarmStampUpdater;

  constructor({ redisUri, beeEndpoint }: SwarmStampSyncerOptions) {
    const connection = createRedisConnection(redisUri);

    connection.on("error", (err) => {
      logger.error(new ErrorException("The Redis connection failed", err));
    });

    this.connection = connection;
    this.swarmUpdater = new SwarmStampUpdater(connection, beeEndpoint);
  }

  async start(cronPattern: string) {
    try {
      await this.swarmUpdater.start(cronPattern);
      logger.info("Swarm stamp syncer started successfully.");
    } catch (err) {
      const err_ = new SwarmStampSyncerError(
        "An error occurred when starting swarm stamps syncer",
        err
      );

      logger.error(err_);

      throw err_;
    }
  }

  async close() {
    try {
      await this.swarmUpdater
        .close()
        .finally(() => {
          this.connection.removeAllListeners();

          if (this.connection.status === "ready") this.connection.disconnect();
        });

      logger.info("Stats syncer closed successfully.");
    } catch (err) {
      const err_ = new SwarmStampSyncerError(
        "An error ocurred when closing syncer",
        err
      );

      logger.error(err_);

      throw err_;
    }
  }
}
