import * as Sentry from "@sentry/node";
import { Cron } from "croner";

import { createLogger } from "@blobscan/logger";
import type { Logger } from "@blobscan/logger";

import { JobError } from "../errors";

export interface CommonJobConfig {
  cronPattern: string;
}

export interface BaseJobConfig extends CommonJobConfig {
  name: string;
  jobFn: () => Promise<void>;
}

export class BaseJob {
  name: string;
  cronPattern: string;

  protected jobFn: () => Promise<void>;
  protected logger: Logger;

  protected cron: Cron | undefined;
  #activeRun: Promise<void> | undefined;

  constructor({ name, cronPattern, jobFn }: BaseJobConfig) {
    this.name = `${name}-job`;
    this.cronPattern = cronPattern;
    this.logger = createLogger(this.name, { defaultMeta: { job: name } });
    this.jobFn = jobFn;
  }

  start() {
    if (this.cron) {
      return;
    }

    try {
      this.cron = new Cron(
        this.cronPattern,
        {
          name: this.name,
          // Skip a tick when the previous run is still active
          protect: () => {
            this.logger.warn("Skipping run: the previous run is still active");
          },
        },
        () => this.run()
      );
    } catch (err) {
      throw new JobError(
        this.name,
        "An error occurred when starting the job",
        err as Error
      );
    }

    this.logger.info("Job started successfully");
  }

  run() {
    const activeRun = this.jobFn()
      .catch((err) => {
        const err_ = new JobError(this.name, "Run failed", err as Error);

        this.logger.error(err_);
        Sentry.captureException(err_);
      })
      .finally(() => {
        this.#activeRun = undefined;
      });

    this.#activeRun = activeRun;

    return activeRun;
  }

  async stop(timeoutMs = 10_000) {
    this.cron?.stop();
    this.cron = undefined;

    if (this.#activeRun) {
      let timeout: NodeJS.Timeout | undefined;

      const timedOut = await Promise.race([
        this.#activeRun.then(() => false),
        new Promise<boolean>((resolve) => {
          timeout = setTimeout(() => resolve(true), timeoutMs);
        }),
      ]);

      clearTimeout(timeout);

      if (timedOut) {
        this.logger.warn(
          `Active run did not complete in ${timeoutMs}ms. Stopping anyway`
        );
      }
    }

    this.logger.info("Job stopped successfully");
  }
}
