import type { FlowChildJob, FlowJob, JobsOptions } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import { $Enums } from "@blobscan/db";

import { DEFAULT_JOB_OPTIONS } from "./constants";
import type {
  BlobPropagationJobData,
  BlobPropagationWorkerParams,
} from "./types";

export function buildJobId(...parts: string[]) {
  return parts.join("-");
}

export function createBlobPropagationFlowJob(
  workerName: string,
  storageWorkerNames: string[],
  versionedHash: string,
  temporaryBlobUri: string,
  opts: Partial<JobsOptions> = {}
): FlowJob {
  const propagationFlowJobId = buildJobId(workerName, versionedHash);

  const children = storageWorkerNames.map((name) =>
    createBlobStorageJob(name, versionedHash)
  );

  return {
    name: `propagateBlob:${propagationFlowJobId}`,
    queueName: workerName,
    data: {
      temporaryBlobUri,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...opts,
      jobId: propagationFlowJobId,
    },
    children,
  };
}

export function createBlobStorageJob(
  storageWorkerName: string,
  versionedHash: string,
  opts: Partial<JobsOptions> = {}
): FlowChildJob {
  const jobId = buildJobId(storageWorkerName, versionedHash);

  return {
    name: `storeBlob:${jobId}`,
    queueName: storageWorkerName,
    data: {
      versionedHash,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      ...opts,
      jobId,
    },
  };
}

export async function propagateBlob(
  { versionedHash }: BlobPropagationJobData,
  targetStorageName: $Enums.BlobStorage,
  { blobStorageManager, prisma }: BlobPropagationWorkerParams
) {
  let blobData: string;

  try {
    blobData = await blobStorageManager
      .getBlobByHash(versionedHash)
      .then(({ data }) => data);
  } catch (err) {
    const blobRefs = await prisma.blobDataStorageReference
      .findMany({
        where: {
          blobHash: versionedHash,
        },
      })
      .then((refs): BlobReference[] =>
        refs.map((ref) => ({
          reference: ref.dataReference,
          storage: ref.blobStorage,
        }))
      );

    if (!blobRefs.length) {
      throw new Error(
        `Failed to propagate blob with hash "${versionedHash}": no blob storage references found to retrieve data from`
      );
    }

    const result = await blobStorageManager.getBlobByReferences(...blobRefs);

    blobData = result.data;
  }

  const targetStorage = blobStorageManager.getStorage(targetStorageName);

  if (!targetStorage) {
    throw new Error(
      `Failed to propagate blob with hash "${versionedHash}": target storage "${targetStorageName}" not found`
    );
  }

  const blobUri = await targetStorage.storeBlob(versionedHash, blobData);

  await prisma.blobDataStorageReference.upsert({
    create: {
      blobStorage: targetStorageName,
      blobHash: versionedHash,
      dataReference: blobUri,
    },
    update: {
      dataReference: blobUri,
    },
    where: {
      blobHash_blobStorage: {
        blobHash: versionedHash,
        blobStorage: targetStorageName,
      },
    },
  });

  return {
    storage: targetStorageName,
    reference: blobUri,
  };
}
