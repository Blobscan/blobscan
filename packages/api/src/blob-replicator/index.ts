import { Worker, FlowProducer } from "bullmq";
import type { FlowChildJob, FlowJob } from "bullmq";
import path from "path";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";

import {
  DEFAULT_WORKER_OPTIONS,
  FLOW_PRODUCER_QUEUE,
  STORAGE_QUEUES,
} from "./config";
import type { BlobReplicationJobData } from "./types";

const WORKERS_DIR = "workers";

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

const blobStorages = Object.values(BlobStorage);

let replicatorFlowProducer: FlowProducer | undefined;
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

export async function setUpBlobReplicationWorkers() {
  const blobStorageManager = await createOrLoadBlobStorageManager();

  const availableStorages = blobStorages.filter(blobStorageManager.hasStorage);

  if (availableStorages.length > 1) {
    replicatorFlowProducer = new FlowProducer();

    storageWorkers = createBlobStorageWorkers(availableStorages);
    replicatorWorker = createReplicatorWorker();
  }
}

export function tearDownBlobReplicationWorkers() {
  const teardownOps = [];

  if (replicatorFlowProducer) {
    teardownOps.push(replicatorFlowProducer.close());
  }

  if (replicatorWorker) {
    teardownOps.push(replicatorWorker.close());
  }

  Object.values(storageWorkers).forEach((worker) =>
    teardownOps.push(worker.close())
  );

  return Promise.all(teardownOps);
}

async function createBlobReplicationJob(
  data: BlobReplicationJobData
): Promise<FlowJob> {
  const blobStorageManager = await createOrLoadBlobStorageManager();
  const versionedHash = data.versionedHash;

  const storageJobs: FlowChildJob[] = blobStorages
    .filter(blobStorageManager.hasStorage)
    .map<FlowChildJob>((storage) => {
      const jobId = `${storage}-${versionedHash}`;

      return {
        name: jobId,
        queueName: STORAGE_QUEUES[storage],
        data,
        opts: {
          jobId,
        },
      };
    });

  const jobId = `${FLOW_PRODUCER_QUEUE}-${versionedHash}`;

  return {
    name: jobId,
    queueName: FLOW_PRODUCER_QUEUE,
    data,
    opts: {
      jobId,
    },
    children: storageJobs,
  };
}

export function isReplicationAvailable() {
  return (
    !!Object.keys(storageWorkers).length ||
    !!replicatorWorker ||
    !!replicatorFlowProducer
  );
}

export async function queueBlobForReplication(data: BlobReplicationJobData) {
  if (!isReplicationAvailable()) {
    throw new Error("Cannot queue blob for replication: no workers available");
  }

  const blobFlowJob = await createBlobReplicationJob(data);

  replicatorFlowProducer?.add(blobFlowJob);
}

export async function queueBlobsForReplication(
  blobReplicationData: BlobReplicationJobData[]
) {
  if (!isReplicationAvailable()) {
    throw new Error("Cannot queue blobs for replication: no workers available");
  }

  const blobReplicationFlowJobs = await Promise.all(
    blobReplicationData.map((data) => createBlobReplicationJob(data))
  );

  return replicatorFlowProducer?.addBulk(blobReplicationFlowJobs);
}
