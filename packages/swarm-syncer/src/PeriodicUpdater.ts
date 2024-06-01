/* eslint-disable @typescript-eslint/no-misused-promises */
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { createModuleLogger } from "@blobscan/logger";
import type { Logger } from "@blobscan/logger";

import { ErrorException, PeriodicUpdaterError } from "./errors";
import { createRedisConnection } from "./utils";

// TODO: Refactor, this file is duplicate (packages: stats-syncer and swarm-syncer)
export type PeriodicUpdaterConfig = {
  name: string;
  redisUriOrConnection: string | Redis;
  updaterFn: () => Promise<void>;
};

export class PeriodicUpdater {
  name: string;
  protected worker: Worker;
  protected queue: Queue;
  protected updaterFn: () => Promise<void>;
  protected logger: Logger;

  constructor({
    name,
    redisUriOrConnection,
    updaterFn,
  }: PeriodicUpdaterConfig) {
    const isRedisUri = typeof redisUriOrConnection === "string";
    this.name = name;
    this.logger = createModuleLogger("stats-syncer", this.name);

    let connection: Redis;

    if (isRedisUri) {
      connection = createRedisConnection(redisUriOrConnection);

      connection.on("error", (err) => {
        this.logger.error(
          new ErrorException("A Redis connection error ocurred", err)
        );
      });
    } else {
      connection = redisUriOrConnection;
    }

    this.queue = new Queue(this.name, {
      connection,
    });

    this.worker = new Worker(this.queue.name, updaterFn, {
      connection,
    });

    this.updaterFn = updaterFn;

    this.queue.on("error", (err) => {
      this.logger.error(new ErrorException("A queue error occurred", err));
    });

    this.worker.on("failed", (_, err) => {
      this.logger.error(new ErrorException("A worker error ocurred", err));
    });
  }

  async start(cronPattern: string) {
    try {
      const jobName = `${this.name}-job`;
      const repeatableJob = await this.queue.add(jobName, null, {
        repeat: {
          pattern: cronPattern,
        },
      });

      return repeatableJob;
    } catch (err) {
      throw new PeriodicUpdaterError(
        this.name,
        "An error ocurred when starting updater",
        err
      );
    }
  }

  close() {
    const teardownPromise: Promise<void> = Promise.resolve();

    return teardownPromise
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.worker.removeAllListeners().close(true)
        );
      })
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.queue.obliterate({ force: true })
        );
      })
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.queue.removeAllListeners().close()
        );
      });
  }

  async #performClosingOperation(operation: () => Promise<void>) {
    try {
      await operation();
    } catch (err) {
      const err_ = new PeriodicUpdaterError(
        this.name,
        "An error ocurred when performing closing operation",
        err
      );

      throw err_;
    }
  }
}
