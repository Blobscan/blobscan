import { Worker, FlowProducer } from "bullmq";
import path from "path";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import {
  DEFAULT_WORKER_OPTIONS,
  FINALIZER_QUEUE,
  STORAGE_QUEUES,
} from "./config";
import { env } from "./env";
import type { BlobPropagationJobData } from "./types";

const BLOB_STORAGE_NAMES = Object.values(BlobStorage);
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

let blobPropagationFlowProducer: FlowProducer | undefined;
let finalizerWorker: Worker | undefined;
let storageWorkers:
  | Record<BlobStorage, Worker<BlobPropagationJobData>>
  | undefined;

function createBlobPropagationFlowProducer() {
  const blobPropagationFlowProducer = new FlowProducer({
    connection: DEFAULT_WORKER_OPTIONS.connection,
  });

  blobPropagationFlowProducer.on("error", (err) => {
    logger.error(`Blob propagation flow producer error: ${err}`);
  });

  return blobPropagationFlowProducer;
}

function createFinalizerWorker() {
  finalizerWorker = new Worker(
    FINALIZER_QUEUE,
    FINALIZER_WORKER_FILE,
    DEFAULT_WORKER_OPTIONS
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

function createBlobStorageWorkers(storages: BlobStorage[]) {
  return storages.reduce<Record<BlobStorage, Worker<BlobPropagationJobData>>>(
    (workers, storageName) => {
      const storageWorker = new Worker<BlobPropagationJobData>(
        STORAGE_QUEUES[storageName],
        STORAGE_WORKER_FILES[storageName],
        DEFAULT_WORKER_OPTIONS
      );

      storageWorker.on("completed", (job) => {
        logger.debug(
          `${STORAGE_QUEUES[storageName]} storage blob propagation job ${job.id} completed`
        );
      });

      storageWorker.on("failed", (job, err) => {
        logger.error(
          `${STORAGE_QUEUES[storageName]} storage blob propagation job ${job?.id} failed: ${err}`
        );
      });

      workers[storageName] = storageWorker;

      return workers;
    },
    {} as Record<BlobStorage, Worker<BlobPropagationJobData>>
  );
}

async function setUpPropagationWorkers() {
  const blobStorageManager = await createOrLoadBlobStorageManager();

  const availableStorages = BLOB_STORAGE_NAMES.filter((storageName) =>
    blobStorageManager.hasStorage(storageName)
  );

  if (availableStorages.length > 1) {
    blobPropagationFlowProducer = createBlobPropagationFlowProducer();
    storageWorkers = createBlobStorageWorkers(availableStorages);
    finalizerWorker = createFinalizerWorker();

    logger.debug(
      `Blob propagation workers set up successfully for the following storages: ${availableStorages.join(
        ", "
      )}`
    );
  } else {
    const reason = availableStorages.length
      ? `only one storage available: ${availableStorages[0]}`
      : "no storage available";

    logger.debug(`Blob propagation workers not set up: ${reason}`);
  }
}

async function tearDownBlobPropagationWorkers() {
  const teardownOperations = [];

  if (storageWorkers) {
    Object.values(storageWorkers).forEach((worker) =>
      teardownOperations.push(worker.close())
    );
  }

  if (finalizerWorker) {
    teardownOperations.push(finalizerWorker.close());
  }

  // Order is important. We need to close child job workers before closing the flow producer
  if (blobPropagationFlowProducer) {
    teardownOperations.push(blobPropagationFlowProducer.close());
  }

  return Promise.all(teardownOperations)
    .then(() => {
      logger.debug(`Blob propagation workers shut down successfully`);
    })
    .catch((err) => {
      logger.error(`Blob propagation workers shut down failed: ${err}`);
    });
}

function areBlobPropagationWorkersEnabled() {
  return env.BLOB_PROPAGATION_WORKERS_ENABLED;
}

function checkBlobPropagationAvailability() {
  if (
    !Object.keys(storageWorkers ?? {}).length ||
    !finalizerWorker ||
    !blobPropagationFlowProducer
  ) {
    throw new Error("Blob propagation is not available: no workers found");
  }

  if (!areBlobPropagationWorkersEnabled()) {
    throw new Error("Blob propagation is not available: workers are disabled");
  }
}

export {
  blobPropagationFlowProducer,
  storageWorkers,
  finalizerWorker as storageRefsCollectorWorker,
  setUpPropagationWorkers,
  tearDownBlobPropagationWorkers,
  areBlobPropagationWorkersEnabled,
  checkBlobPropagationAvailability,
};
