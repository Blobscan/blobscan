/* eslint-disable @typescript-eslint/no-misused-promises */
import { FlowProducer, Queue, Worker } from "bullmq";
import type { ConnectionOptions, FlowJob, WorkerOptions } from "bullmq";

import type { $Enums } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import { blobFileManager } from "./blob-file-manager";
import type { Blob, BlobPropagationJobData } from "./types";
import {
  FINALIZER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
  createBlobPropagationFlowJob,
} from "./utils";
import {
  finalizerProcessor,
  gcsProcessor,
  postgresProcessor,
  swarmProcessor,
} from "./worker-processors";

const STORAGE_WORKER_PROCESSORS = {
  GOOGLE: gcsProcessor,
  SWARM: swarmProcessor,
  POSTGRES: postgresProcessor,
};

export type BlobPropagatorOptions = Partial<{
  workerOptions: WorkerOptions;
}>;

const DEFAULT_WORKER_OPTIONS: WorkerOptions = {
  autorun: true,
  useWorkerThreads: false,
  removeOnComplete: { count: 1000 },
};

export class BlobPropagator {
  protected blobPropagationFlowProducer: FlowProducer;
  protected finalizerWorker: Worker;
  protected storageWorkers: Record<
    $Enums.BlobStorage,
    Worker<BlobPropagationJobData>
  >;

  constructor(
    storages: $Enums.BlobStorage[],
    { workerOptions }: BlobPropagatorOptions = {}
  ) {
    if (!storages.length) {
      throw new Error(
        "Couldn't instantiate blob propagator: no storages given"
      );
    }

    this.storageWorkers = this.#createBlobStorageWorkers(
      storages,
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

  async propagateBlob(blob: Blob) {
    await blobFileManager.createFile(blob);

    const blobFlowJob = await this.#createBlobPropagationFlowJob({
      versionedHash: blob.versionedHash,
    });

    await this.blobPropagationFlowProducer.add(blobFlowJob);
  }

  async propagateBlobs(blobs: Blob[]) {
    await Promise.all(blobs.map((blob) => blobFileManager.createFile(blob)));

    const blobPropagationFlowJobs = blobs.map(({ versionedHash }) =>
      this.#createBlobPropagationFlowJob({ versionedHash })
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
      logger.debug(
        `Job ${job.id} completed`
      );
    });

    finalizerWorker.on("failed", (job, err) => {
      logger.error(`Job ${job?.id} failed: ${err}`);
    });

    return finalizerWorker;
  }

  #createBlobStorageWorkers(
    storages: $Enums.BlobStorage[],
    opts: WorkerOptions = {}
  ) {
    return storages.reduce<Record<BlobStorage, Worker<BlobPropagationJobData>>>(
      (workers, storageName) => {
        const workerName = STORAGE_WORKER_NAMES[storageName];
        const storageWorker = new Worker<BlobPropagationJobData>(
          workerName,
          STORAGE_WORKER_PROCESSORS[storageName],
          {
            ...DEFAULT_WORKER_OPTIONS,
            ...opts,
          }
        );

        storageWorker.on("completed", (job) => {
          logger.debug(
            `Job ${job.id} completed by ${workerName}`
          );
        });

        storageWorker.on("failed", (job, err) => {
          logger.error(
            `Job ${job?.id} failed: ${err} (worker: ${workerName})`
          );
        });

        workers[storageName] = storageWorker;

        return workers;
      },
      {} as Record<BlobStorage, Worker<BlobPropagationJobData>>
    );
  }

  #createBlobPropagationFlowJob(data: BlobPropagationJobData): FlowJob {
    const versionedHash = data.versionedHash;

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
