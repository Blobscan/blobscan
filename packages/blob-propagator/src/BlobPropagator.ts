/* eslint-disable @typescript-eslint/no-misused-promises */

import { FlowProducer, Worker } from "bullmq";
import type {
  ConnectionOptions,
  JobsOptions,
  Processor,
  Queue,
  WorkerOptions,
} from "bullmq";
import IORedis from "ioredis";

import type { BlobStorage } from "@blobscan/blob-storage-manager";
import type { BlobscanPrismaClient } from "@blobscan/db";
import type { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { createModuleLogger } from "@blobscan/logger";

import {
  DEFAULT_JOB_OPTIONS,
  DEFAULT_WORKER_OPTIONS,
  FINALIZER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
} from "./constants";
import { BlobPropagatorCreationError, BlobPropagatorError } from "./errors";
import { logger } from "./logger";
import type {
  BlobPropagationInput,
  BlobPropagationWorker,
  BlobPropagationWorkerProcessor,
} from "./types";
import {
  createBlobPropagationFlowJob as _createBlobPropagationFlowJob,
  computeLinearPriority,
} from "./utils";
import {
  fileSystemProcessor,
  finalizerProcessor,
  gcsProcessor,
  postgresProcessor,
  s3Processor,
  swarmProcessor,
} from "./worker-processors";

export type BlobPropagatorConfig = {
  highestBlockNumber?: number;
  blobStorages: BlobStorage[];
  stagingBlobStorage: BlobStorage;
  prisma: BlobscanPrismaClient;
  redisConnectionOrUri: IORedis | string;
  workerOptions?: Partial<Omit<WorkerOptions, "connection">>;
  jobOptions?: Partial<JobsOptions>;
};

export const STORAGE_WORKER_PROCESSORS: Record<
  BlobStorageName,
  BlobPropagationWorkerProcessor | undefined
> = {
  GOOGLE: gcsProcessor,
  SWARM: swarmProcessor,
  POSTGRES: postgresProcessor,
  FILE_SYSTEM: fileSystemProcessor,
  S3: s3Processor,
  WEAVEVM: undefined,
};

export class BlobPropagator {
  protected stagingBlobStorage: BlobStorage;

  protected blobPropagationFlowProducer: FlowProducer;
  protected finalizerWorker: Worker;
  protected storageWorkers: BlobPropagationWorker[];
  protected storageQueues: Queue[];

  protected jobOptions: Partial<JobsOptions>;

  protected highestBlockNumber?: number;

  protected constructor({
    prisma,
    redisConnectionOrUri,
    highestBlockNumber,
    blobStorages,
    stagingBlobStorage,
    jobOptions: jobOptions_ = {},
    workerOptions = {},
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

    const availableStorageNames = blobStorages
      .map((s) => s.name)
      .filter((name) => {
        const hasWorkerProcessor = !!STORAGE_WORKER_PROCESSORS[name];

        if (!hasWorkerProcessor) {
          logger.warn(
            `Worker processor not defined for storage "${name}"; skipping`
          );
        }

        return hasWorkerProcessor;
      });

    if (!availableStorageNames.length) {
      throw new BlobPropagatorCreationError(
        "None of the available storages have worker processors defined"
      );
    }

    this.storageWorkers = blobStorages.map((storage) => {
      const storageName = storage.name;
      const workerProcessor = STORAGE_WORKER_PROCESSORS[storageName];

      if (!workerProcessor) {
        throw new BlobPropagatorCreationError(
          `Worker processor not defined for storage "${storageName}"`
        );
      }

      return this.#createWorker(
        STORAGE_WORKER_NAMES[storageName],
        workerProcessor({
          prisma,
          targetBlobStorage: storage,
          stagingBlobStorage,
        }),
        workerOptions_
      );
    });

    this.storageQueues = [];

    this.finalizerWorker = this.#createWorker(
      FINALIZER_WORKER_NAME,
      finalizerProcessor({ stagingBlobStorage }),
      workerOptions_
    );

    this.blobPropagationFlowProducer = this.#createFlowProducer(connection);
    this.stagingBlobStorage = stagingBlobStorage;
    this.jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...jobOptions_,
    };
    this.highestBlockNumber = highestBlockNumber;

    logger.info("Blob propagator started successfully");
  }

  static async create(
    config: Omit<BlobPropagatorConfig, "highestBlockNumber">
  ) {
    const lastFinalizedBlock = await config.prisma.blockchainSyncState
      .findFirst()
      .then((s) => s?.lastFinalizedBlock ?? undefined);

    return new BlobPropagator({
      ...config,
      highestBlockNumber: lastFinalizedBlock,
    });
  }

  async propagateBlob({
    blockNumber,
    versionedHash,
    data,
  }: BlobPropagationInput) {
    try {
      const stagedBlobUri = await this.stagingBlobStorage.stageBlob(
        versionedHash,
        data
      );

      const flowJob = this.createBlobPropagationFlowJob({
        blockNumber,
        stagedBlobUri,
        versionedHash,
      });

      await this.blobPropagationFlowProducer.add(flowJob);
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

      const stagedBlobUris = await Promise.all(
        uniqueBlobs.map(({ versionedHash, data }) =>
          this.stagingBlobStorage.stageBlob(versionedHash, data)
        )
      );

      const blobPropagationFlowJobs = uniqueBlobs.map(
        ({ blockNumber, versionedHash }, i) =>
          this.createBlobPropagationFlowJob({
            blockNumber,
            stagedBlobUri: stagedBlobUris[i] as string,
            versionedHash,
          })
      );

      await this.blobPropagationFlowProducer.addBulk(blobPropagationFlowJobs);
    } catch (err) {
      const blobHashes = blobs.map((b) => `"${b.versionedHash}"`).join(", ");

      throw new BlobPropagatorError(
        `Failed to propagate blobs with hashes ${blobHashes}`,
        err as Error
      );
    }
  }

  protected createBlobPropagationFlowJob({
    blockNumber,
    stagedBlobUri,
    versionedHash,
  }: {
    blockNumber?: number;
    stagedBlobUri: string;
    versionedHash: string;
  }) {
    const jobPriority = this.#computeJobPriority(blockNumber);
    const storageWorkerNames = this.storageWorkers.map((w) => w.name);

    return _createBlobPropagationFlowJob(
      this.finalizerWorker.name,
      storageWorkerNames,
      versionedHash,
      stagedBlobUri,
      {
        priority: jobPriority,
      }
    );
  }

  #computeJobPriority(jobBlockNumber?: number): number {
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

    this.storageWorkers.forEach((w) => {
      teardownPromise = teardownPromise.finally(async () => {
        await this.#performClosingOperation(() => w.close());
      });
    });

    await teardownPromise
      .finally(async () => {
        await this.#performClosingOperation(() => this.finalizerWorker.close());
      })
      .finally(async () => {
        await this.#performClosingOperation(async () => {
          const redisClient = await this.blobPropagationFlowProducer.client;

          await redisClient.quit();
        });
      })
      .finally(async () => {
        await this.#performClosingOperation(() =>
          this.blobPropagationFlowProducer.close()
        );
      });

    logger.info("Blob propagator closed successfully.");
  }

  #createFlowProducer(connection?: ConnectionOptions) {
    /*
     * Instantiating a new `FlowProducer` appears to create two separate `RedisConnection` instances.
     * This leads to an issue where one instance remains active, or "dangling", after the `FlowProducer` has been closed.
     * To prevent this, we now initialize a single `IORedis` instance in advance and use it when creating the `FlowProducer`.
     * This way, both created connections reference the same `IORedis` instance and can be closed properly.
     *
     * See: https://github.com/taskforcesh/bullmq/blob/d7cf6ea60830b69b636648238a51e5f981616d02/src/classes/flow-producer.ts#L111
     */
    const blobPropagationFlowProducer = new FlowProducer({
      connection,
    });
    const flowProducerLogger = createModuleLogger(
      "blob-propagator",
      "flow-producer"
    );

    blobPropagationFlowProducer.on("error", (err) => {
      flowProducerLogger.error(err);
    });

    return blobPropagationFlowProducer;
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
