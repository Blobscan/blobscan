import { FlowProducer, Worker } from "bullmq";
import type {
  ConnectionOptions,
  FlowChildJob,
  FlowJob,
  WorkerOptions,
} from "bullmq";
import path from "path";

import type { $Enums } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import type { Blob, BlobPropagationJobData } from "./types";
import { createBlobDataFile } from "./utils";

const WORKERS_DIR = "worker-processors";
/**
 * Define workers on separated files to run them on different
 * processes
 */
const STORAGE_WORKER_FILES: Record<BlobStorage, string> = {
  GOOGLE: path.join(__dirname, WORKERS_DIR, "gcs.ts"),
  SWARM: path.join(__dirname, WORKERS_DIR, "swarm.ts"),
  POSTGRES: path.join(__dirname, WORKERS_DIR, "postgres.ts"),
};
const FINALIZER_WORKER_FILE = path.join(__dirname, WORKERS_DIR, "finalizer.ts");

export type BlobPropagatorOptions = Partial<{
  workerOptions: WorkerOptions;
}>;

const DEFAULT_WORKER_OPTIONS: WorkerOptions = {
  useWorkerThreads: true,
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

    this.blobPropagationFlowProducer = this.#createBlobPropagationFlowProducer(
      workerOptions?.connection
    );

    this.finalizerWorker = this.#createFinalizerWorker(workerOptions);
    this.storageWorkers = this.#createBlobStorageWorkers(
      storages,
      workerOptions
    );
  }

  async close() {
    const teardownOperations = [];

    Object.values(this.storageWorkers).forEach((worker) =>
      teardownOperations.push(worker.close())
    );
    teardownOperations.push(this.finalizerWorker.close());

    // Order is important. We need to close child job workers before closing the flow producer
    teardownOperations.push(this.blobPropagationFlowProducer.close());

    await Promise.all(teardownOperations);
  }

  async propagateBlob(blob: Blob) {
    await createBlobDataFile(blob);

    const blobFlowJob = await this.#createBlobPropagationFlowJob({
      versionedHash: blob.versionedHash,
    });

    await this.blobPropagationFlowProducer.add(blobFlowJob);
  }

  async propagateBlobs(blobs: Blob[]) {
    await Promise.all(blobs.map((blob) => createBlobDataFile(blob)));

    const blobPropagationFlowJobs = blobs.map(({ versionedHash }) =>
      this.#createBlobPropagationFlowJob({ versionedHash })
    );

    await this.blobPropagationFlowProducer.addBulk(blobPropagationFlowJobs);
  }

  #createBlobPropagationFlowProducer(connection?: ConnectionOptions) {
    const opts = connection ? { connection } : undefined;
    const blobPropagationFlowProducer = new FlowProducer(opts);

    blobPropagationFlowProducer.on("error", (err) => {
      logger.error(`Blob propagation flow producer error: ${err}`);
    });

    return blobPropagationFlowProducer;
  }

  #createFinalizerWorker(opts: WorkerOptions = {}) {
    const finalizerWorker = new Worker(
      "finalizer-worker",
      FINALIZER_WORKER_FILE,
      {
        ...DEFAULT_WORKER_OPTIONS,
        ...opts,
      }
    );

    finalizerWorker.on("completed", (job) => {
      logger.debug(
        `Propagation finalizer job ${job.id} completed. Blob propagated successfully`
      );
    });

    finalizerWorker.on("failed", (job, err) => {
      logger.error(`Propagation finalizer job ${job?.id} failed: ${err}`);
    });

    return finalizerWorker;
  }

  #createBlobStorageWorkers(
    storages: $Enums.BlobStorage[],
    opts: WorkerOptions = {}
  ) {
    return storages.reduce<Record<BlobStorage, Worker<BlobPropagationJobData>>>(
      (workers, storageName) => {
        const workerName = `${storageName.toLowerCase()}-worker`;
        const storageWorker = new Worker<BlobPropagationJobData>(
          workerName,
          STORAGE_WORKER_FILES[storageName],
          {
            ...DEFAULT_WORKER_OPTIONS,
            ...opts,
          }
        );

        storageWorker.on("completed", (job) => {
          logger.debug(
            `${workerName}: storage blob propagation job ${job.id} completed`
          );
        });

        storageWorker.on("failed", (job, err) => {
          logger.error(
            `${workerName}: storage blob propagation job ${job?.id} failed: ${err}`
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

    const storageJobs: FlowChildJob[] = Object.values(
      this.storageWorkers
    ).map<FlowChildJob>((storageWorker) => {
      const jobId = `${storageWorker.name}-${versionedHash}`;

      return {
        name: `storeBlob:${jobId}`,
        queueName: storageWorker.name,
        data,
        opts: {
          jobId,
        },
      };
    });

    const jobId = `${this.finalizerWorker.name}-${versionedHash}`;

    return {
      name: `propagateBlob:${jobId}`,
      queueName: this.finalizerWorker.name,
      data,
      opts: {
        jobId,
      },
      children: storageJobs,
    };
  }
}
