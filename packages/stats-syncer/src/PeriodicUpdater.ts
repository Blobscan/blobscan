/* eslint-disable @typescript-eslint/no-misused-promises */
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { logger } from "@blobscan/logger";

import { createRedisConnection } from "./utils";

export type PeriodicUpdaterConfig = {
  name: string;
  redisUriOrConnection: string | Redis;
  updaterFn: () => Promise<void>;
};

export class PeriodicUpdater {
  name: string;
  protected worker: Worker;
  protected queue: Queue;

  constructor({
    name,
    redisUriOrConnection,
    updaterFn,
  }: PeriodicUpdaterConfig) {
    const isRedisUri = typeof redisUriOrConnection === "string";
    this.name = name;

    const scope = `Updater "${this.name}"`;

    const connection = isRedisUri
      ? createRedisConnection(scope, redisUriOrConnection)
      : redisUriOrConnection;

    this.queue = new Queue(this.name, {
      connection,
    });

    this.worker = new Worker(this.name, updaterFn, {
      connection,
    });

    this.queue.on("error", (err) => {
      logger.error(`${scope} queue error: ${err}`);
    });

    this.worker.on("error", (err) => {
      logger.error(`${scope} worker error: ${err}`);
    });
  }

  async run(cronPattern: string) {
    try {
      const jobName = `${this.name}-job`;
      const repeatableJob = await this.queue.add(jobName, null, {
        repeat: {
          pattern: cronPattern,
        },
      });

      return repeatableJob;
    } catch (err) {
      throw new Error(`Failed to run updater "${this.name}": ${err}`);
    }
  }

  async close() {
    try {
      await this.worker
        .removeAllListeners()
        .close(true)
        .finally(async () => this.queue.obliterate({ force: true }))
        .finally(async () => this.queue.removeAllListeners().close());
    } catch (err) {
      throw new Error(`Failed to close updater "${this.name}": ${err}`);
    }
  }
}
