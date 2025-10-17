/* eslint-disable @typescript-eslint/no-misused-promises */

import { Worker, Queue } from "bullmq";
import type { JobsOptions, Processor, WorkerOptions } from "bullmq";
import IORedis from "ioredis";

import type { BlobStorage } from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient } from "@blobscan/db";
import { createLogger, logger } from "@blobscan/logger";

import {
  DEFAULT_JOB_OPTIONS,
  DEFAULT_WORKER_OPTIONS,
  RECONCILER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
} from "./constants";
import { BlobPropagatorCreationError, BlobPropagatorError } from "./errors";
import type {
  BlobPropagationInput,
  BlobPropagationWorkerParams,
  Reconciler,
  ReconcilerProcessorParams,
  ReconcilerProcessorResult,
  StoragePropagator,
} from "./types";
import { createBlobPropagationJob, computeLinearPriority } from "./utils";
import { blobPropagatorProcessor } from "./worker-processors/propagator";
import { reconcilerProcessor } from "./worker-processors/reconciler";

export type BlobPropagatorConfig = {
  highestBlockNumber?: number;
  blobStorages: BlobStorage[];
  primaryBlobStorage: BlobStorage;
  prisma: BlobscanPrismaClient;
  redisConnectionOrUri: IORedis | string;
  workerOptions?: Partial<Omit<WorkerOptions, "connection">>;
  jobOptions?: Partial<JobsOptions>;
  enableReconciler?: boolean;
  reconcilerConfig?: {
    batchSize: number;
    cronPattern: string;
  };
};

export class BlobPropagator {
  protected prisma: BlobscanPrismaClient;
  protected primaryBlobStorage: BlobStorage;

  protected propagators: StoragePropagator[];
  protected reconciler?: Reconciler;

  protected jobOptions: Partial<JobsOptions>;

  protected highestBlockNumber?: number;

  protected constructor({
    enableReconciler,
    prisma,
    redisConnectionOrUri,
    highestBlockNumber,
    blobStorages,
    primaryBlobStorage,
    jobOptions: jobOptions_ = {},
    workerOptions = {},
    reconcilerConfig,
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

    if (enableReconciler) {
      if (!reconcilerConfig) {
        throw new Error(
          "Reconciler is enabled, but no reconcilerConfig was provided"
        );
      }

      this.reconciler = this.#createReconciler(
        {
          batchSize: reconcilerConfig.batchSize,
          prisma,
          primaryBlobStorage,
          propagatorQueues: this.propagators.map(({ queue }) => queue),
          highestBlockNumber: this.highestBlockNumber,
        },
        workerOptions_
      );

      logger.debug("Blob reconciler created!");
    }

    this.prisma = prisma;
  }

  static async create(
    config: Omit<BlobPropagatorConfig, "highestBlockNumber">
  ) {
    const { prisma, reconcilerConfig } = config;

    try {
      const lastFinalizedBlock = await prisma.blockchainSyncState
        .findFirst()
        .then((s) => s?.lastFinalizedBlock ?? undefined);

      const blobPropagator = new BlobPropagator({
        ...config,
        highestBlockNumber: lastFinalizedBlock,
      });

      if (blobPropagator.reconciler) {
        if (!reconcilerConfig?.cronPattern) {
          throw new Error("No cron pattern provided for reconciler");
        }
        await blobPropagator.reconciler.queue.add("reconciler-job", null, {
          repeat: {
            pattern: reconcilerConfig.cronPattern,
          },
        });
      }

      return blobPropagator;
    } catch (err) {
      if (err instanceof Error) {
        throw new BlobPropagatorCreationError(err);
      }

      throw new BlobPropagatorCreationError(
        new Error("Unknown cause", { cause: err })
      );
    }
  }

  async propagateBlob({
    blockNumber,
    versionedHash,
    data,
  }: BlobPropagationInput) {
    try {
      const blobReference = await this.#storeBlob(versionedHash, data);

      const queueOperations = this.propagators.map(({ queue }) => {
        const priority = this.computeJobPriority(blockNumber);
        const job = createBlobPropagationJob(
          queue.name,
          versionedHash,
          blobReference.dataReference,
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

      const blobReferences = await Promise.all(
        uniqueBlobs.map(({ versionedHash, data }) =>
          this.#storeBlob(versionedHash, data)
        )
      );

      const queueBulkOperations = this.propagators.map(({ queue }) => {
        const jobs = uniqueBlobs.map(({ blockNumber, versionedHash }, i) => {
          const priority = this.computeJobPriority(blockNumber);
          return createBlobPropagationJob(
            queue.name,
            versionedHash,
            blobReferences[i]?.dataReference as string,
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

    const reconcilier = this.reconciler;

    if (reconcilier) {
      teardownPromise = teardownPromise
        .finally(async () => {
          await this.#performClosingOperation(() => reconcilier.worker.close());
        })
        .finally(async () => {
          await this.#performClosingOperation(() =>
            reconcilier.queue.obliterate({ force: true })
          );
        });
    }

    await teardownPromise;
  }

  async #storeBlob(versionedHash: string, data: string) {
    const blobStorage = this.primaryBlobStorage.name;
    const blobUri = await this.primaryBlobStorage.storeBlob(
      versionedHash,
      data
    );

    return this.prisma.blobDataStorageReference.upsert({
      create: {
        blobStorage,
        blobHash: versionedHash,
        dataReference: blobUri,
      },
      update: {
        dataReference: blobUri,
      },
      where: {
        blobHash_blobStorage: {
          blobHash: versionedHash,
          blobStorage: blobStorage,
        },
      },
    });
  }

  #createReconciler(
    params: ReconcilerProcessorParams,
    opts: WorkerOptions
  ): Reconciler {
    const queue = new Queue(RECONCILER_WORKER_NAME, {
      connection: opts.connection,
    });
    const worker = new Worker<null, ReconcilerProcessorResult>(
      RECONCILER_WORKER_NAME,
      reconcilerProcessor(params),
      opts
    );
    const workerLogger = createLogger(RECONCILER_WORKER_NAME);

    worker.on("completed", (_, { jobsCreated, blobTimestamps }) => {
      if (!jobsCreated) {
        workerLogger?.info("No blobs to reconciliate found");

        return;
      }

      workerLogger?.info(
        `${jobsCreated} jobs recreated; From: ${
          blobTimestamps?.firstBlob?.toISOString() ?? "-"
        } To: ${blobTimestamps?.lastBlob?.toISOString() ?? "-"}`
      );
    });

    worker.on("failed", (_, err) => {
      workerLogger?.error(err);
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
    const supportedBlobStorages = blobStorages.filter(
      (s) => s.name !== "WEAVEVM"
    );

    return supportedBlobStorages.map((targetBlobStorage) => {
      const storageName = targetBlobStorage.name;

      const workerName = STORAGE_WORKER_NAMES[storageName];

      const queue = new Queue(workerName, opts);
      const worker = this.#createWorker(
        workerName,
        blobPropagatorProcessor({
          ...params,
          targetBlobStorage,
        }),
        opts
      );

      logger.debug(`Queue and worker created for storage ${targetBlobStorage}`);

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
    const workerLogger = createLogger(workerName);

    worker.on("completed", (job) => {
      workerLogger?.debug(`Job ${job.id} completed`);
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
