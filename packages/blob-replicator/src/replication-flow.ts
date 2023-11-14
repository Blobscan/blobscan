import type { FlowJob, FlowChildJob } from "bullmq";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import { createBlobDataFile } from "./blob-data-file";
import { FINALIZER_QUEUE, STORAGE_QUEUES } from "./config";
import type { Blob, BlobReplicationJobData } from "./types";
import {
  blobReplicationFlowProducer,
  checkBlobReplicationAvailability,
} from "./workers";

const BLOB_STORAGE_NAMES = Object.values(BlobStorage);

async function createBlobReplicationFlowJob(
  data: BlobReplicationJobData
): Promise<FlowJob> {
  const blobStorageManager = await createOrLoadBlobStorageManager();
  const versionedHash = data.versionedHash;

  const storageJobs: FlowChildJob[] = BLOB_STORAGE_NAMES.filter((storage) =>
    blobStorageManager.hasStorage(storage)
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

  const jobId = `${FINALIZER_QUEUE}-${versionedHash}`;

  return {
    name: jobId,
    queueName: FINALIZER_QUEUE,
    data,
    opts: {
      jobId,
    },
    children: storageJobs,
  };
}

export async function addBlobToReplicationFlowQueue(blob: Blob) {
  checkBlobReplicationAvailability();

  await createBlobDataFile(blob);

  const blobFlowJob = await createBlobReplicationFlowJob(blob);

  await blobReplicationFlowProducer?.add(blobFlowJob);

  logger.debug(`Blob replication job created for blob ${blob.versionedHash}`);
}

export async function addBlobsToReplicationFlowQueue(blobs: Blob[]) {
  checkBlobReplicationAvailability();

  await Promise.all(blobs.map((blob) => createBlobDataFile(blob)));

  const blobReplicationFlowJobs = await Promise.all(
    blobs.map((data) => createBlobReplicationFlowJob(data))
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await blobReplicationFlowProducer!.addBulk(blobReplicationFlowJobs);
}
