import { Queue, Worker } from "bullmq";
import type { Redis } from "ioredis";

import { createModuleLogger } from "@blobscan/logger";
import type { Logger } from "@blobscan/logger";

import { ErrorException, SyncerError } from "./errors";

export type BaseSyncerConfig = {
  name: string;
  connection: Redis;
  cronPattern: string;
  syncerFn: () => Promise<void>;
};

export class BaseSyncer {
  private name: string;
  private cronPattern: string;
  private logger: Logger;

  public readonly worker: Worker;
  public readonly queue: Queue;

  constructor({ name, cronPattern, connection, syncerFn }: BaseSyncerConfig) {
    this.name = `${name}-syncer`;
    this.cronPattern = cronPattern;
    this.logger = createModuleLogger(this.name);

    this.queue = new Queue(this.name, { connection });
    this.worker = new Worker(this.queue.name, syncerFn, { connection });

    this.queue.on("error", (error) => {
      this.logger.error(new ErrorException("A queue error occurred", error));
    });

    this.worker.on("failed", (_, error) => {
      this.logger.error(new ErrorException("A worker error occurred", error));
    });
  }

  async start() {
    try {
      const repeatableJob = await this.queue.add(`${this.name}-job`, null, {
        repeat: {
          pattern: this.cronPattern,
        },
      });

      this.logger.info("Syncer started successfully");

      return repeatableJob;
    } catch (error) {
      throw new SyncerError(
        this.name,
        "An error occurred when starting syncer",
        error
      );
    }
  }

  async close(): Promise<void> {
    const results = await Promise.allSettled([
      this.queue.obliterate({ force: true }),
      this.queue.removeAllListeners().close(),
      this.worker.removeAllListeners().close(true),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        throw new SyncerError(
          this.name,
          "An error occurred when performing closing operation",
          result.reason
        );
      }
    }

    this.logger.info("Syncer closed successfully");
  }
}
