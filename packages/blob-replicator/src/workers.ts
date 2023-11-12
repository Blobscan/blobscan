import { Worker, FlowProducer } from "bullmq";
import path from "path";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import type { BlobStorage } from "@blobscan/db";

import {
  DEFAULT_WORKER_OPTIONS,
  FLOW_PRODUCER_QUEUE,
  STORAGE_QUEUES,
} from "./config";
import { BLOB_STORAGES } from "./utils";

const WORKERS_DIR = "worker-processors";

// Specify the js files instead that will be built along the rest of the source code.
const STORAGE_WORKER_FILES: Record<BlobStorage, string> = {
  GOOGLE: path.join(__dirname, WORKERS_DIR, "gcs.js"),
  SWARM: path.join(__dirname, WORKERS_DIR, "swarm.js"),
  POSTGRES: path.join(__dirname, WORKERS_DIR, "postgres.js"),
};
const PROPAGATOR_WORKER_FILE = path.join(
  __dirname,
  WORKERS_DIR,
  "replicator.js"
);

let blobReplicationFlowProducer: FlowProducer | undefined;
let replicatorWorker: Worker | undefined;
let storageWorkers: Record<BlobStorage, Worker>;

function createReplicatorWorker() {
  replicatorWorker = new Worker(
    FLOW_PRODUCER_QUEUE,
    PROPAGATOR_WORKER_FILE,
    DEFAULT_WORKER_OPTIONS
  );

  replicatorWorker.on("completed", (job) => {
    console.log(
      `Completed replication job ${job.id} in ${FLOW_PRODUCER_QUEUE}`
    );
  });

  return replicatorWorker;
}

function createBlobStorageWorkers(storages: BlobStorage[]) {
  return storages.reduce<Record<BlobStorage, Worker>>(
    (workers, storageName) => {
      const storageWorker = new Worker(
        STORAGE_QUEUES[storageName],
        STORAGE_WORKER_FILES[storageName],
        DEFAULT_WORKER_OPTIONS
      );

      storageWorker.on("completed", (job) => {
        console.log(
          `Completed job ${job.id} in ${STORAGE_QUEUES[storageName]}`
        );
      });

      storageWorker.on("failed", (job, err) => {
        console.error(
          `Failed job ${job?.id} in ${STORAGE_QUEUES[storageName]}: ${err}`
        );
      });

      workers[storageName] = storageWorker;

      return workers;
    },
    {} as Record<BlobStorage, Worker>
  );
}

async function setUpBlobReplicationWorkers() {
  const blobStorageManager = await createOrLoadBlobStorageManager();

  const availableStorages = BLOB_STORAGES.filter(blobStorageManager.hasStorage);

  if (availableStorages.length > 1) {
    blobReplicationFlowProducer = new FlowProducer();

    storageWorkers = createBlobStorageWorkers(availableStorages);
    replicatorWorker = createReplicatorWorker();
  }
}

function tearDownBlobReplicationWorkers() {
  const teardownOps = [];

  if (blobReplicationFlowProducer) {
    teardownOps.push(blobReplicationFlowProducer.close());
  }

  if (replicatorWorker) {
    teardownOps.push(replicatorWorker.close());
  }

  Object.values(storageWorkers).forEach((worker) =>
    teardownOps.push(worker.close())
  );

  return Promise.all(teardownOps);
}

export {
  blobReplicationFlowProducer,
  storageWorkers,
  replicatorWorker,
  setUpBlobReplicationWorkers,
  tearDownBlobReplicationWorkers,
};
