import { FlowProducer, Worker } from "bullmq";
import type {
  ConnectionOptions,
  FlowChildJob,
  FlowJob,
  WorkerOptions,
  RedisOptions,
  JobsOptions,
} from "bullmq";
import IORedis from "ioredis";

import type { $Enums } from "@blobscan/db";
import type { BlobStorage } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import { blobFileManager } from "./blob-file-manager";
import type { Blob, BlobPropagationJobData } from "./types";
import {
  FINALIZER_WORKER_NAME,
  STORAGE_WORKER_NAMES,
  buildJobId,
  emptyWorkerJobQueue,
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

const DEFAULT_JOB_OPTIONS: Omit<JobsOptions, "repeat"> = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
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

    this.storageWorkers = this.#createBlobStorageWorkers(
      storages,
      workerOptions
    );
    this.finalizerWorker = this.#createFinalizerWorker(workerOptions);
    this.blobPropagationFlowProducer = this.#createBlobPropagationFlowProducer(
      workerOptions?.connection
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
      FINALIZER_WORKER_NAME,
      finalizerProcessor,
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
      const jobId = buildJobId(storageWorker, versionedHash);

      return {
        name: `storeBlob:${jobId}`,
        queueName: storageWorker.name,
        data,
        opts: {
          ...DEFAULT_JOB_OPTIONS,
          jobId,
        },
      };
    });

    const jobId = buildJobId(this.finalizerWorker, versionedHash);

    return {
      name: `propagateBlob:${jobId}`,
      queueName: this.finalizerWorker.name,
      data,
      opts: {
        ...DEFAULT_JOB_OPTIONS,
        jobId,
      },
      children: storageJobs,
    };
  }
}
