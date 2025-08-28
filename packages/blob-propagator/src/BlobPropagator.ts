/* eslint-disable @typescript-eslint/no-misused-promises */

import { Worker, Queue } from "bullmq";
import type { JobsOptions, Processor, WorkerOptions } from "bullmq";
import IORedis from "ioredis";

import type { BlobStorage } from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient } from "@blobscan/db";
import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { createModuleLogger } from "@blobscan/logger";

import {
  DEFAULT_JOB_OPTIONS,
  DEFAULT_WORKER_OPTIONS,
  RECONCILIATOR_WORKER_NAME,
  STORAGE_WORKER_NAMES,
} from "./constants";
import { BlobPropagatorCreationError, BlobPropagatorError } from "./errors";
import { logger } from "./logger";
import type {
  BlobPropagationInput,
  BlobPropagationWorkerParams,
  BlobPropagationWorkerProcessor,
  Reconciliator,
  ReconciliatorProcessorParams,
  ReconciliatorProcessorResult,
  StoragePropagator,
} from "./types";
import { createBlobPropagationJob, computeLinearPriority } from "./utils";
import {
  gcsProcessor,
  postgresProcessor,
  s3Processor,
  swarmProcessor,
} from "./worker-processors";
import { reconciliatorProcessor } from "./worker-processors/reconciliator";

export type BlobPropagatorConfig = {
  highestBlockNumber?: number;
  blobStorages: BlobStorage[];
  primaryBlobStorage: BlobStorage;
  prisma: BlobscanPrismaClient;
  redisConnectionOrUri: IORedis | string;
  workerOptions?: Partial<Omit<WorkerOptions, "connection">>;
  jobOptions?: Partial<JobsOptions>;
  reconciliatorOpts: {
    batchSize: number;
    cronPattern: string;
  };
};

export const STORAGE_WORKER_PROCESSORS: Record<
  BlobStorageName,
  BlobPropagationWorkerProcessor | undefined
> = {
  GOOGLE: gcsProcessor,
  SWARM: swarmProcessor,
  POSTGRES: postgresProcessor,
  S3: s3Processor,
  WEAVEVM: undefined,
};

export class BlobPropagator {
  protected primaryBlobStorage: BlobStorage;

  protected propagators: StoragePropagator[];
  protected reconciliator: Reconciliator;

  protected jobOptions: Partial<JobsOptions>;

  protected highestBlockNumber?: number;

  protected constructor({
    prisma,
    redisConnectionOrUri,
    highestBlockNumber,
    blobStorages,
    primaryBlobStorage,
    jobOptions: jobOptions_ = {},
    workerOptions = {},
    reconciliatorOpts,
  }: BlobPropagatorConfig) {
    const connection =
      typeof redisConnectionOrUri === "string"
        ? new IORedis(redisConnectionOrUri, { maxRetriesPerRequest: null })
        : redisConnectionOrUri;
    const workerOptions_ = {
      ...DEFAULT_WORKER_OPTIONS,
      connection,
      ...workerOptions,
    };

    this.propagators = this.#createPropagators(
      blobStorages,
      {
        prisma,
        primaryBlobStorage,
      },
      workerOptions_
    );

    this.primaryBlobStorage = primaryBlobStorage;
    this.jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...jobOptions_,
    };
    this.highestBlockNumber = highestBlockNumber;

    this.reconciliator = this.#createReconciliator(
      {
        batchSize: reconciliatorOpts.batchSize,
        prisma,
        primaryBlobStorage,
        propagatorQueues: this.propagators.map(({ queue }) => queue),
        highestBlockNumber: this.highestBlockNumber,
      },
      workerOptions_
    );

    logger.info("Blob propagator started successfully");
  }

  static async create(
    config: Omit<BlobPropagatorConfig, "highestBlockNumber">
  ) {
    const { prisma, reconciliatorOpts } = config;

    const lastFinalizedBlock = await prisma.blockchainSyncState
      .findFirst()
      .then((s) => s?.lastFinalizedBlock ?? undefined);

    const blobPropagator = new BlobPropagator({
      ...config,
      highestBlockNumber: lastFinalizedBlock,
    });

    await blobPropagator.reconciliator.queue.add("reconciliator-job", null, {
      repeat: {
        pattern: reconciliatorOpts.cronPattern,
      },
    });

    return blobPropagator;
  }

  async propagateBlob({
    blockNumber,
    versionedHash,
    data,
  }: BlobPropagationInput) {
    try {
      const blobUri = await this.primaryBlobStorage.storeBlob(
        versionedHash,
        data
      );

      const queueOperations = this.propagators.map(({ queue }) => {
        const priority = this.computeJobPriority(blockNumber);
        const job = createBlobPropagationJob(
          queue.name,
          versionedHash,
          blobUri,
          {
            priority,
          }
        );

        return queue.add(job.name, job.data, job.opts);
      });

      await Promise.all(queueOperations);
    } catch (err) {
      throw new BlobPropagatorError(
        `Failed to propagate blob with hash "${versionedHash}"`,
        err as Error
      );
    }
  }

  async propagateBlobs(blobs: BlobPropagationInput[]) {
    try {
      const uniqueBlobs = Array.from(
        new Set(blobs.map((b) => b.versionedHash))
      ).map((versionedHash) => {
        const blob = blobs.find((b) => b.versionedHash === versionedHash);

        if (!blob) {
          throw new Error(
            `Blob not found for versioned hash "${versionedHash}"`
          );
        }

        return blob;
      });

      const blobUris = await Promise.all(
        uniqueBlobs.map(({ versionedHash, data }) =>
          this.primaryBlobStorage.storeBlob(versionedHash, data)
        )
      );

      const queueBulkOperations = this.propagators.map(({ queue }) => {
        const jobs = uniqueBlobs.map(({ blockNumber, versionedHash }, i) => {
          const priority = this.computeJobPriority(blockNumber);
          return createBlobPropagationJob(
            queue.name,
            versionedHash,
            blobUris[i] as string,
            {
              priority,
            }
          );
        });

        return queue.addBulk(jobs);
      });

      await Promise.all(queueBulkOperations);
    } catch (err) {
      const blobHashes = blobs.map((b) => `"${b.versionedHash}"`).join(", ");

      throw new BlobPropagatorError(
        `Failed to propagate blobs with hashes ${blobHashes}`,
        err as Error
      );
    }
  }

  protected computeJobPriority(jobBlockNumber?: number): number {
    if (!jobBlockNumber) {
      return 1;
    }

    if (!this.highestBlockNumber || jobBlockNumber > this.highestBlockNumber) {
      this.highestBlockNumber = jobBlockNumber;
    }

    return computeLinearPriority(jobBlockNumber, {
      max: this.highestBlockNumber ?? jobBlockNumber,
    });
  }

  async close() {
    let teardownPromise: Promise<void> = Promise.resolve();

    this.propagators.forEach(({ worker }) => {
      teardownPromise = teardownPromise.finally(async () => {
        await this.#performClosingOperation(() => worker.close());
      });
    });

    this.propagators.forEach(({ queue }) => {
      teardownPromise = teardownPromise.finally(async () => {
        await this.#performClosingOperation(() => queue.close());
      });
    });

    teardownPromise = teardownPromise
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.reconciliator.worker.close()
        );
      })
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.reconciliator.queue.obliterate({ force: true })
        );
      });

    await teardownPromise;

    logger.info("Blob propagator closed successfully.");
  }

  #createReconciliator(
    params: ReconciliatorProcessorParams,
    opts: WorkerOptions
  ): Reconciliator {
    const queue = new Queue(RECONCILIATOR_WORKER_NAME, {
      connection: opts.connection,
    });
    const worker = new Worker<null, ReconciliatorProcessorResult>(
      RECONCILIATOR_WORKER_NAME,
      reconciliatorProcessor(params),
      opts
    );
    const workerLogger = createModuleLogger("blob-reconciliator", worker.name);

    worker.on("completed", (_, { jobsCreated, blobTimestamps }) => {
      if (!jobsCreated) {
        workerLogger.info("No blobs to reconciliate found");

        return;
      }

      workerLogger.info(
        `${jobsCreated} jobs recreated; From: ${
          blobTimestamps?.firstBlob?.toISOString() ?? "-"
        } To: ${blobTimestamps?.lastBlob?.toISOString() ?? "-"}`
      );
    });

    worker.on("failed", (_, err) => {
      workerLogger.error(err);
    });

    return {
      worker,
      queue,
    };
  }

  #createPropagators(
    blobStorages: BlobStorage[],
    params: Omit<BlobPropagationWorkerParams, "targetBlobStorage">,
    opts: WorkerOptions
  ): StoragePropagator[] {
    if (!blobStorages.length) {
      throw new BlobPropagatorCreationError("No blob storage provided");
    }

    return blobStorages.map((targetBlobStorage) => {
      const storageName = targetBlobStorage.name;
      const workerProcessor = STORAGE_WORKER_PROCESSORS[storageName];

      if (!workerProcessor) {
        throw new BlobPropagatorCreationError(
          `Storage ${storageName} not supported: no worker processor defined`
        );
      }

      const workerName = STORAGE_WORKER_NAMES[storageName];

      const queue = new Queue(workerName, opts);
      const worker = this.#createWorker(
        workerName,
        workerProcessor({
          ...params,
          targetBlobStorage,
        }),
        opts
      );

      return {
        queue,
        worker,
      };
    });
  }

  #createWorker(
    workerName: string,
    workerProcessor: Processor,
    opts: WorkerOptions = {}
  ) {
    const worker = new Worker(workerName, workerProcessor, opts);
    const workerLogger = createModuleLogger("blob-propagator", worker.name);

    worker.on("completed", (job) => {
      workerLogger.debug(`Job ${job.id} completed`);
    });

    worker.on("failed", (_, err) => {
      workerLogger.error(err);
    });

    return worker;
  }

  async #performClosingOperation(operation: () => Promise<void>) {
    try {
      await operation();
    } catch (err) {
      throw new BlobPropagatorError(
        "Failed to perform closing operation",
        err as Error
      );
    }
  }
}
