/* eslint-disable @typescript-eslint/no-misused-promises */
import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { createModuleLogger } from "@blobscan/logger";
import type { Logger } from "@blobscan/logger";

import { ErrorException } from "./errors";
import { createRedis } from "./redis";

export interface CommonCronJobConfig {
  redisUriOrConnection: Redis | string;
  cronPattern: string;
}

export interface BaseCronJobConfig extends CommonCronJobConfig {
  name: string;
  jobFn: () => Promise<void>;
}

export class CronJobError extends ErrorException {
  constructor(cronJobName: string, message: string, cause: unknown) {
    super(`Cron job "${cronJobName}" failed: ${message}`, cause);
  }
}

export class BaseCronJob {
  name: string;
  cronPattern: string;

  protected jobFn: () => Promise<void>;
  protected logger: Logger;

  protected connection: Redis;
  protected worker: Worker | undefined;
  protected queue: Queue | undefined;

  constructor({
    name,
    cronPattern,
    redisUriOrConnection,
    jobFn,
  }: BaseCronJobConfig) {
    this.name = `${name}-cron-job`;
    this.cronPattern = cronPattern;
    this.logger = createModuleLogger(this.name);

    let connection: Redis;

    if (typeof redisUriOrConnection === "string") {
      connection = createRedis(redisUriOrConnection);
    } else {
      connection = redisUriOrConnection;
    }

    this.queue = new Queue(this.name, {
      connection,
    });

    this.worker = new Worker(this.queue.name, jobFn, {
      connection,
    });

    this.queue.on("error", (err) => {
      this.logger.error(new ErrorException("A queue error occurred", err));
    });

    this.worker.on("failed", (_, err) => {
      this.logger.error(new ErrorException("A worker error ocurred", err));
    });

    this.connection = connection;
    this.jobFn = jobFn;
  }

  async start() {
    try {
      const jobName = `${this.name}-job`;
      const repeatableJob = await this.queue?.add(jobName, null, {
        repeat: {
          pattern: this.cronPattern,
        },
      });

      this.logger.debug("Cron job started successfully");

      return repeatableJob;
    } catch (err) {
      throw new CronJobError(
        this.name,
        "An error ocurred when starting cron job",
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

        this.logger.info("Cron job closed successfully");
      });
  }

  async #performClosingOperation(operation: () => Promise<void> | undefined) {
    try {
      await operation();
    } catch (err) {
      const err_ = new CronJobError(
        this.name,
        "An error ocurred when performing closing operation",
        err
      );

      throw err_;
    }
  }
}
