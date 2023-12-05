import { FlowProducer, Worker } from "bullmq";
import type {
  ConnectionOptions,
  FlowChildJob,
  FlowJob,
  WorkerOptions,
  RedisOptions,
} from "bullmq";
import IORedis from "ioredis";
import path from "path";

import type { $Enums } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import { blobFileManager } from "./blob-file-manager";
import type { Blob, BlobPropagationJobData } from "./types";
import { emptyWorkerJobQueue } from "./utils";

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

function isRedisOptions(
  connection: ConnectionOptions
): connection is RedisOptions {
  return (
    "host" in connection &&
    "port" in connection &&
    "password" in connection &&
    "username" in connection
  );
}

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

  close(opts?: { emptyJobs: boolean }) {
    let teardownPromise: Promise<void> = Promise.resolve();
    const emptyJobs = opts?.emptyJobs;

    Object.values(this.storageWorkers).forEach((w) => {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      teardownPromise = teardownPromise.finally(async () => {
        if (emptyJobs) {
          await emptyWorkerJobQueue(w);
        }

        await w.close();
      });
    });

    return (
      teardownPromise
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .finally(async () => {
          if (emptyJobs) {
            await emptyWorkerJobQueue(this.finalizerWorker);
          }

          await this.finalizerWorker.close();
        })
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .finally(async () => {
          const redisClient = await this.blobPropagationFlowProducer.client;

          await redisClient.quit();
        })
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .finally(async () => {
          await this.blobPropagationFlowProducer.close();
        })
    );
  }

  async propagateBlob(blob: Blob) {
    await blobFileManager.createBlobDataFile(blob);

    const blobFlowJob = await this.#createBlobPropagationFlowJob({
      versionedHash: blob.versionedHash,
    });

    await this.blobPropagationFlowProducer.add(blobFlowJob);
  }

  async propagateBlobs(blobs: Blob[]) {
    await Promise.all(
      blobs.map((blob) => blobFileManager.createBlobDataFile(blob))
    );

    const blobPropagationFlowJobs = blobs.map(({ versionedHash }) =>
      this.#createBlobPropagationFlowJob({ versionedHash })
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
    const redisConnection =
      connection && isRedisOptions(connection)
        ? new IORedis({
            host: connection.host,
            port: connection.port,

            password: connection.password,
            maxRetriesPerRequest: null,
          })
        : connection;

    const blobPropagationFlowProducer = new FlowProducer({
      connection: redisConnection,
    });

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
