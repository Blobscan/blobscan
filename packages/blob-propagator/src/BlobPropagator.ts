/* eslint-disable @typescript-eslint/no-misused-promises */
import { FlowProducer, Worker } from "bullmq";
import type { ConnectionOptions, JobsOptions, WorkerOptions } from "bullmq";

import type {
  BlobStorage,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import type { $Enums, BlobscanPrismaClient } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import {
  DEFAULT_JOB_OPTIONS,
  DEFAULT_WORKER_OPTIONS,
  FINALIZER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
} from "./constants";
import type {
  Blob,
  BlobPropagationFinalizerWorkerParams,
  BlobPropagationJobData,
  BlobPropagationWorker,
  BlobPropagationWorkerParams,
} from "./types";
import { createBlobPropagationFlowJob } from "./utils";
import {
  fileSystemProcessor,
  finalizerProcessor,
  gcsProcessor,
  postgresProcessor,
  swarmProcessor,
} from "./worker-processors";

export type BlobPropagatorConfig = {
  blobStorageManager: BlobStorageManager;
  tmpBlobStorage: $Enums.BlobStorage;
  prisma: BlobscanPrismaClient;
  workerOptions: Partial<WorkerOptions>;
  jobOptions?: Partial<JobsOptions>;
};

export const STORAGE_WORKER_PROCESSORS = {
  GOOGLE: gcsProcessor,
  SWARM: swarmProcessor,
  POSTGRES: postgresProcessor,
  FILE_SYSTEM: fileSystemProcessor,
};

export class BlobPropagator {
  protected temporaryBlobStorage: BlobStorage;

  protected blobPropagationFlowProducer: FlowProducer;
  protected finalizerWorker: Worker;
  protected storageWorkers: BlobPropagationWorker[];

  protected jobOptions: Partial<JobsOptions>;

  constructor({
    blobStorageManager,
    prisma,
    tmpBlobStorage,
    jobOptions: jobOptions_ = {},
    workerOptions: workerOptions_ = {},
  }: BlobPropagatorConfig) {
    const workerOptions = {
      ...DEFAULT_WORKER_OPTIONS,
      ...workerOptions_,
    };

    const availableStorageNames = blobStorageManager
      .getAllStorages()
      .map((s) => s.name)
      .filter((name) => name !== tmpBlobStorage);
    const temporaryBlobStorage = blobStorageManager.getStorage(tmpBlobStorage);

    if (!availableStorageNames) {
      throw new Error(
        "Couldn't instantiate blob propagator: No storages available"
      );
    }

    if (!temporaryBlobStorage) {
      throw new Error(
        "Couldn't instantiate blob propagator: Temporary storage not found in blob storage manager"
      );
    }

    this.storageWorkers = this.#createBlobStorageWorkers(
      availableStorageNames,
      {
        blobStorageManager,
        prisma,
      },
      workerOptions
    );
    this.finalizerWorker = this.#createFinalizerWorker(
      { temporaryBlobStorage },
      workerOptions
    );
    this.blobPropagationFlowProducer = this.#createBlobPropagationFlowProducer(
      workerOptions?.connection
    );
    this.temporaryBlobStorage = temporaryBlobStorage;
    this.jobOptions = {
      ...DEFAULT_JOB_OPTIONS,
      ...jobOptions_,
    };
  }

  close() {
    let teardownPromise: Promise<void> = Promise.resolve();

    this.storageWorkers.forEach((w) => {
      teardownPromise = teardownPromise.finally(async () => {
        await w.close();
      });
    });

    return teardownPromise
      .finally(async () => {
        await this.finalizerWorker.close();
      })
      .finally(async () => {
        const redisClient = await this.blobPropagationFlowProducer.client;

        await redisClient.quit();
      })
      .finally(async () => {
        await this.blobPropagationFlowProducer.close();
      });
  }

  async propagateBlob({ versionedHash, data }: Blob) {
    const temporalBlobUri = await this.temporaryBlobStorage.storeBlob(
      versionedHash,
      data
    );

    const storageWorkerNames = this.storageWorkers.map((w) => w.name);
    const flowJob = createBlobPropagationFlowJob(
      this.finalizerWorker.name,
      storageWorkerNames,
      versionedHash,
      temporalBlobUri
    );

    await this.blobPropagationFlowProducer.add(flowJob);
  }

  async propagateBlobs(blobs: Blob[]) {
    const uniqueBlobs = Array.from(
      new Set(blobs.map((b) => b.versionedHash))
    ).map((versionedHash) => {
      // @typescript-eslint/no-non-null-assertion
      const blob = blobs.find((b) => b.versionedHash === versionedHash)!;

      return blob;
    });

    const temporalBlobUris = await Promise.all(
      uniqueBlobs.map(({ versionedHash, data }) =>
        this.temporaryBlobStorage.storeBlob(versionedHash, data)
      )
    );

    const storageWorkerNames = this.storageWorkers.map((w) => w.name);
    const blobPropagationFlowJobs = uniqueBlobs.map(({ versionedHash }, i) =>
      createBlobPropagationFlowJob(
        this.finalizerWorker.name,
        storageWorkerNames,
        versionedHash,
        temporalBlobUris[i] as string
      )
    );

    await this.blobPropagationFlowProducer.addBulk(blobPropagationFlowJobs);
  }

  #createBlobPropagationFlowProducer(connection?: ConnectionOptions) {
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

    blobPropagationFlowProducer.on("error", (err) => {
      logger.error(`Blob propagation flow producer error: ${err}`);
    });

    return blobPropagationFlowProducer;
  }

  #createFinalizerWorker(
    params: BlobPropagationFinalizerWorkerParams,
    opts: WorkerOptions = {}
  ) {
    const finalizerWorker = new Worker(
      FINALIZER_WORKER_NAME,
      finalizerProcessor(params),
      {
        ...DEFAULT_WORKER_OPTIONS,
        ...opts,
      }
    );

    finalizerWorker.on("completed", (job) => {
      logger.debug(`Worker ${FINALIZER_WORKER_NAME}: Job ${job.id} completed`);
    });

    finalizerWorker.on("failed", (job, err) => {
      logger.error(
        `Worker ${FINALIZER_WORKER_NAME}: Job ${job?.id} failed: ${err}`
      );
    });

    return finalizerWorker;
  }

  #createBlobStorageWorkers(
    storages: $Enums.BlobStorage[],
    params: BlobPropagationWorkerParams,
    opts: WorkerOptions = {}
  ) {
    return storages.map((storageName) => {
      const workerName = STORAGE_WORKER_NAMES[storageName];
      const storageWorker = new Worker<BlobPropagationJobData>(
        workerName,
        STORAGE_WORKER_PROCESSORS[storageName](params),
        opts
      );

      storageWorker.on("completed", (job) => {
        logger.debug(`Worker ${workerName}: Job ${job.id} completed`);
      });

      storageWorker.on("failed", (job, err) => {
        logger.error(`Worker: ${workerName}: Job ${job?.id} failed: ${err}`);
      });

      return storageWorker;
    });
  }
}
