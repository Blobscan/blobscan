/* eslint-disable @typescript-eslint/no-misused-promises */
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import type { LoggerLevel } from "@blobscan/logger";

import { createRedisConnection, log } from "./utils";

export type PeriodicUpdaterConfig = {
  name: string;
  redisUriOrConnection: string | Redis;
  updaterFn: () => Promise<void>;
  log?: (config: {
    level: LoggerLevel;
    message: string;
    updater?: string;
  }) => void;
};

export class PeriodicUpdater {
  name: string;
  protected worker: Worker;
  protected queue: Queue;
  protected updaterFn: () => Promise<void>;

  constructor({
    name,
    redisUriOrConnection,
    updaterFn,
  }: PeriodicUpdaterConfig) {
    const isRedisUri = typeof redisUriOrConnection === "string";
    this.name = name;

    let connection: Redis;

    if (isRedisUri) {
      connection = createRedisConnection(redisUriOrConnection);

      connection.on("error", (err) => {
        log("error", `redis connection error: ${err}`, {
          updater: name,
        });
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
      log("error", `queue error: ${err}`, {
        updater: name,
      });
    });

    this.worker.on("failed", (_, err) => {
      log("error", `worker error: ${err.message}`, {
        updater: name,
      });
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
        .finally(() => this.queue.obliterate({ force: true }))
        .finally(() => this.queue.removeAllListeners().close());
    } catch (err) {
      throw new Error(`Failed to close updater "${this.name}": ${err}`);
    }
  }
}
