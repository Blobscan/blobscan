/* eslint-disable @typescript-eslint/no-misused-promises */
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { createModuleLogger } from "@blobscan/logger";
import type { Logger } from "@blobscan/logger";

import { ErrorException, SyncerError } from "./errors";
import { createRedisConnection } from "./utils";

export interface CommonSyncerConfig {
  redisUriOrConnection: Redis | string;
  cronPattern: string;
}

export interface BaseSyncerConfig extends CommonSyncerConfig {
  name: string;
  syncerFn: () => Promise<void>;
}

export class BaseSyncer {
  name: string;
  cronPattern: string;

  protected syncerFn: () => Promise<void>;
  protected logger: Logger;

  protected connection: Redis;
  protected worker: Worker | undefined;
  protected queue: Queue | undefined;

  constructor({
    name,
    cronPattern,
    redisUriOrConnection,
    syncerFn,
  }: BaseSyncerConfig) {
    this.name = `${name}-syncer`;
    this.cronPattern = cronPattern;
    this.logger = createModuleLogger(this.name);

    let connection: Redis;

    if (typeof redisUriOrConnection === "string") {
      connection = createRedisConnection(redisUriOrConnection);
    } else {
      connection = redisUriOrConnection;
    }

    this.queue = new Queue(this.name, {
      connection,
    });

    this.worker = new Worker(this.queue.name, syncerFn, {
      connection,
    });

    this.queue.on("error", (err) => {
      this.logger.error(new ErrorException("A queue error occurred", err));
    });

    this.worker.on("failed", (_, err) => {
      this.logger.error(new ErrorException("A worker error ocurred", err));
    });

    this.connection = connection;
    this.syncerFn = syncerFn;
  }

  async start() {
    try {
      const jobName = `${this.name}-job`;
      const repeatableJob = await this.queue?.add(jobName, null, {
        repeat: {
          pattern: this.cronPattern,
        },
      });

      this.logger.info("Syncer started successfully");

      return repeatableJob;
    } catch (err) {
      throw new SyncerError(
        this.name,
        "An error ocurred when starting syncer",
        err
      );
    }
  }

  close() {
    const teardownPromise: Promise<void> = Promise.resolve();

    return teardownPromise
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.worker?.removeAllListeners().close(true)
        );
      })
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.queue?.obliterate({ force: true })
        );
      })
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.queue?.removeAllListeners().close()
        );

        this.logger.info("Syncer closed successfully");
      });
  }

  async #performClosingOperation(operation: () => Promise<void> | undefined) {
    try {
      await operation();
    } catch (err) {
      const err_ = new SyncerError(
        this.name,
        "An error ocurred when performing closing operation",
        err
      );

      throw err_;
    }
  }
}
