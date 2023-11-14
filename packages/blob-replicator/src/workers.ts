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
import type { BlobReplicationJobData } from "./types";

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
const STORAGE_REFS_COLLECTOR_WORKER_FILE = path.join(
  __dirname,
  WORKERS_DIR,
  "storage-refs-collector.ts"
);

let blobReplicationFlowProducer: FlowProducer | undefined;
let storageRefsCollectorWorker: Worker | undefined;
let storageWorkers:
  | Record<BlobStorage, Worker<BlobReplicationJobData>>
  | undefined;

function createBlobReplicationFlowProducer() {
  const blobReplicationFlowProducer = new FlowProducer({
    connection: DEFAULT_WORKER_OPTIONS.connection,
  });

  blobReplicationFlowProducer.on("error", (err) => {
    logger.error(`Blob replication flow producer error: ${err}`);
  });

  return blobReplicationFlowProducer;
}

function createStorageRefsCollectorWorker() {
  storageRefsCollectorWorker = new Worker(
    FINALIZER_QUEUE,
    STORAGE_REFS_COLLECTOR_WORKER_FILE,
    DEFAULT_WORKER_OPTIONS
  );

  storageRefsCollectorWorker.on("completed", (job) => {
    logger.debug(
      `Storage refs collector job ${job.id} completed. Blob replicated successfully`
    );
  });

  storageRefsCollectorWorker.on("failed", (job, err) => {
    logger.error(`Storage refs collector job ${job?.id} failed: ${err}`);
  });

  return storageRefsCollectorWorker;
}

function createBlobStorageWorkers(storages: BlobStorage[]) {
  return storages.reduce<Record<BlobStorage, Worker<BlobReplicationJobData>>>(
    (workers, storageName) => {
      const storageWorker = new Worker<BlobReplicationJobData>(
        STORAGE_QUEUES[storageName],
        STORAGE_WORKER_FILES[storageName],
        DEFAULT_WORKER_OPTIONS
      );

      storageWorker.on("completed", (job) => {
        logger.debug(
          `${STORAGE_QUEUES[storageName]} storage blob replication job ${job.id} completed`
        );
      });

      storageWorker.on("failed", (job, err) => {
        logger.error(
          `${STORAGE_QUEUES[storageName]} storage blob replication job ${job?.id} failed: ${err}`
        );
      });

      workers[storageName] = storageWorker;

      return workers;
    },
    {} as Record<BlobStorage, Worker<BlobReplicationJobData>>
  );
}

async function setUpBlobReplicationWorkers() {
  const blobStorageManager = await createOrLoadBlobStorageManager();

  const availableStorages = BLOB_STORAGE_NAMES.filter((storageName) =>
    blobStorageManager.hasStorage(storageName)
  );

  if (availableStorages.length > 1) {
    blobReplicationFlowProducer = createBlobReplicationFlowProducer();
    storageWorkers = createBlobStorageWorkers(availableStorages);
    storageRefsCollectorWorker = createStorageRefsCollectorWorker();

    logger.debug(
      `Blob replication workers set up successfully for the following storages: ${availableStorages.join(
        ", "
      )}`
    );
  } else {
    const reason = availableStorages.length
      ? `only one storage available: ${availableStorages[0]}`
      : "no storage available";

    logger.debug(`Blob replication workers not set up: ${reason}`);
  }
}

async function tearDownBlobReplicationWorkers() {
  const teardownOperations = [];

  if (storageWorkers) {
    Object.values(storageWorkers).forEach((worker) =>
      teardownOperations.push(worker.close())
    );
  }

  if (storageRefsCollectorWorker) {
    teardownOperations.push(storageRefsCollectorWorker.close());
  }

  // Order is important. We need to close child job workers before closing the flow producer
  if (blobReplicationFlowProducer) {
    teardownOperations.push(blobReplicationFlowProducer.close());
  }

  return Promise.all(teardownOperations)
    .then(() => {
      logger.debug(`Blob replication workers shut down successfully`);
    })
    .catch((err) => {
      logger.error(`Blob replication workers shut down failed: ${err}`);
    });
}

function areBlobReplicationWorkersEnabled() {
  return env.BLOB_REPLICATION_WORKERS_ENABLED;
}

function checkBlobReplicationAvailability() {
  if (
    !Object.keys(storageWorkers ?? {}).length ||
    !storageRefsCollectorWorker ||
    !blobReplicationFlowProducer
  ) {
    throw new Error("Blob replication is not available: no workers found");
  }

  if (!areBlobReplicationWorkersEnabled()) {
    throw new Error("Blob replication is not available: workers are disabled");
  }
}

export {
  blobReplicationFlowProducer,
  storageWorkers,
  storageRefsCollectorWorker,
  setUpBlobReplicationWorkers,
  tearDownBlobReplicationWorkers,
  areBlobReplicationWorkersEnabled,
  checkBlobReplicationAvailability,
};
