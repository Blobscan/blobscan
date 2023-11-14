import type { FlowJob, FlowChildJob } from "bullmq";

import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import { createBlobDataFile } from "./blob-data-file";
import { FINALIZER_QUEUE, STORAGE_QUEUES } from "./config";
import type { Blob, BlobPropagationJobData } from "./types";
import {
  blobPropagationFlowProducer,
  checkBlobPropagationAvailability,
} from "./workers";

const BLOB_STORAGE_NAMES = Object.values(BlobStorage);

async function createBlobPropagationFlowJob(
  data: BlobPropagationJobData
): Promise<FlowJob> {
  const blobStorageManager = await createOrLoadBlobStorageManager();
  const versionedHash = data.versionedHash;

  const storageJobs: FlowChildJob[] = BLOB_STORAGE_NAMES.filter((storage) =>
    blobStorageManager.hasStorage(storage)
  ).map<FlowChildJob>((storage) => {
    const jobId = `${storage}-${versionedHash}`;

    return {
      name: `storeBlob:${jobId}`,
      queueName: STORAGE_QUEUES[storage],
      data,
      opts: {
        jobId,
      },
    };
  });

  const jobId = `${FINALIZER_QUEUE}-${versionedHash}`;

  return {
    name: `propagateBlob:${jobId}`,
    queueName: FINALIZER_QUEUE,
    data,
    opts: {
      jobId,
    },
    children: storageJobs,
  };
}

export async function addBlobToPropagationFlowQueue(blob: Blob) {
  checkBlobPropagationAvailability();

  await createBlobDataFile(blob);

  const blobFlowJob = await createBlobPropagationFlowJob(blob);

  await blobPropagationFlowProducer?.add(blobFlowJob);

  logger.debug(`Blob propagator job created for blob ${blob.versionedHash}`);
}

export async function addBlobsToPropagationFlowQueue(blobs: Blob[]) {
  checkBlobPropagationAvailability();

  await Promise.all(blobs.map((blob) => createBlobDataFile(blob)));

  const blobPropagationFlowJobs = await Promise.all(
    blobs.map((data) => createBlobPropagationFlowJob(data))
  );

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  await blobPropagationFlowProducer!.addBulk(blobPropagationFlowJobs);
}
