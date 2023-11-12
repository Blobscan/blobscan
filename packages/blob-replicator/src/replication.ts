import type { FlowJob, FlowChildJob } from "bullmq";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";

import { FLOW_PRODUCER_QUEUE, STORAGE_QUEUES } from "./config";
import type { BlobReplicationJobData } from "./types";
import { BLOB_STORAGES } from "./utils";
import {
  blobReplicationFlowProducer,
  replicatorWorker,
  storageWorkers,
} from "./workers";

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

export function isBlobReplicationAvailable() {
  return (
    !!Object.keys(storageWorkers).length ||
    !!replicatorWorker ||
    !!blobReplicationFlowProducer
  );
}

export async function queueBlobForReplication(data: BlobReplicationJobData) {
  if (!isBlobReplicationAvailable()) {
    throw new Error("Cannot queue blob for replication: no workers available");
  }

  const blobFlowJob = await createBlobReplicationJob(data);

  blobReplicationFlowProducer?.add(blobFlowJob);
}

export async function queueBlobsForReplication(
  blobReplicationData: BlobReplicationJobData[]
) {
  if (!isBlobReplicationAvailable()) {
    throw new Error("Cannot queue blobs for replication: no workers available");
  }

  const blobReplicationFlowJobs = await Promise.all(
    blobReplicationData.map((data) => createBlobReplicationJob(data))
  );

  return blobReplicationFlowProducer?.addBulk(blobReplicationFlowJobs);
}
