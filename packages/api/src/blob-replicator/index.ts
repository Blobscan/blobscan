import { FlowProducer, Worker } from "bullmq";
import type { FlowChildJob, FlowJob, WorkerOptions } from "bullmq";
import path from "path";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";

import { FLOW_PRODUCER_QUEUE, STORAGE_QUEUES } from "./config";
import type { BlobReplicationJobData } from "./types";

const WORKERS_DIR = "workers";

const STORAGE_WORKER_FILES: Record<BlobStorage, string> = {
  GOOGLE: path.join(__dirname, WORKERS_DIR, "gcs.js"),
  SWARM: path.join(__dirname, WORKERS_DIR, "swarm.js"),
  POSTGRES: path.join(__dirname, WORKERS_DIR, "postgres.js"),
};
const PROPAGATOR_WORKER_FILE = path.join(
  __dirname,
  WORKERS_DIR,
  "propagator-flow-producer.js"
);

const replicatorFlowProducer = new FlowProducer();

const BLOB_STORAGES = Object.values(BlobStorage);

export async function setUpBlobReplicationWorkers() {
  const blobStorageManager = await createOrLoadBlobStorageManager();
  const workerOptions: WorkerOptions = {
    useWorkerThreads: true,
  };

  const storageWorkers = BLOB_STORAGES.filter(
    blobStorageManager.hasStorage
  ).reduce<Record<BlobStorage, Worker>>((workers, storageName) => {
    const storageWorker = new Worker(
      STORAGE_QUEUES[storageName],
      STORAGE_WORKER_FILES[storageName],
      workerOptions
    );

    storageWorker.on("completed", (job) => {
      console.log(`Completed job ${job.id} in ${STORAGE_QUEUES[storageName]}`);
    });

    storageWorker.on("failed", (job, err) => {
      console.error(
        `Failed job ${job?.id} in ${STORAGE_QUEUES[storageName]}: ${err}`
      );
    });

    workers[storageName] = storageWorker;

    return workers;
  }, {} as Record<BlobStorage, Worker>);

  if (Object.values(storageWorkers).length) {
    const replicatorWorker = new Worker(
      FLOW_PRODUCER_QUEUE,
      PROPAGATOR_WORKER_FILE,
      workerOptions
    );
  }
}

async function createBlobReplicationJob(
  data: BlobReplicationJobData
): Promise<FlowJob> {
  const blobStorageManager = await createOrLoadBlobStorageManager();
  const versionedHash = data.versionedHash;

  const storageJobs: FlowChildJob[] = BLOB_STORAGES.filter(
    blobStorageManager.hasStorage
  ).map<FlowChildJob>((storage) => {
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

export async function queueBlobForReplication(data: BlobReplicationJobData) {
  const blobFlowJob = await createBlobReplicationJob(data);

  replicatorFlowProducer.add(blobFlowJob);
}

export async function queueBlobsForReplication(
  blobReplicationData: BlobReplicationJobData[]
) {
  const blobReplicationFlowJobs = await Promise.all(
    blobReplicationData.map((data) => createBlobReplicationJob(data))
  );

  return replicatorFlowProducer.addBulk(blobReplicationFlowJobs);
}
