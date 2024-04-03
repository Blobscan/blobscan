/* eslint-disable @typescript-eslint/no-misused-promises */
import { FlowProducer, Queue, Worker } from "bullmq";
import type { ConnectionOptions, FlowJob, WorkerOptions } from "bullmq";

import type {
  BlobStorage,
  BlobStorageManager,
} from "@blobscan/blob-storage-manager";
import type { $Enums, BlobscanPrismaClient } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import { blobFileManager } from "./blob-file-manager";
import type {
  Blob,
  BlobPropagationJobData,
  BlobPropagationWorkerParams,
} from "./types";
import {
  FINALIZER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
  createBlobPropagationFlowJob,
} from "./utils";
import {
  fileSystemProcessor,
  finalizerProcessor,
  gcsProcessor,
  postgresProcessor,
  swarmProcessor,
} from "./worker-processors";

const STORAGE_WORKER_PROCESSORS = {
  GOOGLE: gcsProcessor,
  SWARM: swarmProcessor,
  POSTGRES: postgresProcessor,
  FILE_SYSTEM: fileSystemProcessor,
};

export type BlobPropagatorConfig = {
  blobStorageManager: BlobStorageManager;
  tmpBlobStorage: $Enums.BlobStorage;
  prisma: BlobscanPrismaClient;
  workerOptions: Partial<WorkerOptions>;
};

const DEFAULT_WORKER_OPTIONS: WorkerOptions = {
  autorun: true,
  useWorkerThreads: false,
  removeOnComplete: { count: 1000 },
};

export class BlobPropagator {
  protected blobStorageManager: BlobStorageManager;
  protected prisma: BlobscanPrismaClient;
  protected temporaryBlobStorage: BlobStorage;

  protected blobPropagationFlowProducer: FlowProducer;
  protected finalizerWorker: Worker;
  protected storageWorkers: Record<
    $Enums.BlobStorage,
    Worker<BlobPropagationJobData>
  >;

  constructor({
    blobStorageManager,
    prisma,
    tmpBlobStorage,
    workerOptions,
  }: BlobPropagatorConfig) {
    const availableStorageNames = blobStorageManager
      .getAllStorages()
      .map((s) => s.name);

    if (!availableStorageNames) {
      throw new Error(
        "Couldn't instantiate blob propagator: No storages available"
      );
    }

    if (!availableStorageNames.find((s) => s === tmpBlobStorage)) {
      throw new Error(
        "Couldn't instantiate blob propagator: Temporary storage not found in blob storage manager"
      );
    }

    this.blobStorageManager = blobStorageManager;
    this.prisma = prisma;

    const temporaryBlobStorage = blobStorageManager.getStorage(tmpBlobStorage);

    if (!temporaryBlobStorage) {
      throw new Error(
        "Couldn't instantiate blob propagator: Temporary storage not found in blob storage manager"
      );
    }

    this.temporaryBlobStorage = temporaryBlobStorage;

    this.storageWorkers = this.#createBlobStorageWorkers(
      availableStorageNames,
      {
        blobStorageManager,
        prisma,
      },
      workerOptions
    );
    this.finalizerWorker = this.#createFinalizerWorker(workerOptions);
    this.blobPropagationFlowProducer = this.#createBlobPropagationFlowProducer(
      workerOptions?.connection
    );
  }

  async empty({ force }: { force: boolean } = { force: false }) {
    const workers = this.#getWorkers();
    const queues = await Promise.all(
      workers.map(
        async (w) => new Queue(w.name, { connection: await w.client })
      )
    );

    let emptyPromise = Promise.all([
      ...queues.map((q) => q.obliterate({ force })),
      blobFileManager.removeFolder(),
    ]);

    queues.forEach((q) => {
      emptyPromise = emptyPromise.finally(async () => {
        await q.close();
      });
    });

    await emptyPromise;
  }

  close() {
    let teardownPromise: Promise<void> = Promise.resolve();

    Object.values(this.storageWorkers).forEach((w) => {
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
    await this.temporaryBlobStorage.storeBlob(versionedHash, data);

    const flowJob = await this.#createBlobPropagationFlowJob(versionedHash);

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

    await Promise.all(
      uniqueBlobs.map(({ versionedHash, data }) =>
        this.temporaryBlobStorage.storeBlob(versionedHash, data)
      )
    );

    const blobPropagationFlowJobs = uniqueBlobs.map(({ versionedHash }) =>
      this.#createBlobPropagationFlowJob(versionedHash)
    );

    await this.blobPropagationFlowProducer.addBulk(blobPropagationFlowJobs);
  }

  #getWorkers() {
    return [...Object.values(this.storageWorkers), this.finalizerWorker];
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

  #createFinalizerWorker(opts: WorkerOptions = {}) {
    const finalizerWorker = new Worker(
      FINALIZER_WORKER_NAME,
      finalizerProcessor,
      {
        ...DEFAULT_WORKER_OPTIONS,
        ...opts,
      }
    );

    finalizerWorker.on("completed", (job) => {
      logger.debug(`Job ${job.id} completed`);
    });

    finalizerWorker.on("failed", (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err}`);
    });

    return finalizerWorker;
  }

  #createBlobStorageWorkers(
    storages: $Enums.BlobStorage[],
    params: BlobPropagationWorkerParams,
    opts: WorkerOptions = {}
  ) {
    return storages.reduce<
      Record<$Enums.BlobStorage, Worker<BlobPropagationJobData>>
    >((workers, storageName) => {
      const workerName = STORAGE_WORKER_NAMES[storageName];
      const storageWorker = new Worker<BlobPropagationJobData>(
        workerName,
        STORAGE_WORKER_PROCESSORS[storageName](params),
        {
          ...DEFAULT_WORKER_OPTIONS,
          ...opts,
        }
      );

      storageWorker.on("completed", (job) => {
        logger.debug(`Job ${job.id} completed by ${workerName}`);
      });

      storageWorker.on("failed", (job, err) => {
        logger.error(`Job ${job?.id} failed: ${err} (worker: ${workerName})`);
      });

      workers[storageName] = storageWorker;

      return workers;
    }, {} as Record<$Enums.BlobStorage, Worker<BlobPropagationJobData>>);
  }

  #createBlobPropagationFlowJob(versionedHash: string): FlowJob {
    const storageWorkerNames = Object.values(this.storageWorkers).map(
      (storageWorker) => storageWorker.name
    );

    return createBlobPropagationFlowJob(
      this.finalizerWorker.name,
      storageWorkerNames,
      versionedHash
    );
  }
}
