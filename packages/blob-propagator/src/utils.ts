import type { FlowChildJob, FlowJob, JobsOptions } from "bullmq";

import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma, $Enums } from "@blobscan/db";

import { blobFileManager } from "./blob-file-manager";

const DEFAULT_JOB_OPTIONS: Omit<JobsOptions, "repeat"> = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
};

export const STORAGE_WORKER_NAMES = Object.values($Enums.BlobStorage).reduce<
  Record<$Enums.BlobStorage, string>
>(
  (names, storage) => ({
    ...names,
    [storage]: `${storage.toLowerCase()}-worker`,
  }),
  {} as Record<$Enums.BlobStorage, string>
);

export const FINALIZER_WORKER_NAME = "finalizer-worker";

export function buildJobId(...parts: string[]) {
  return parts.join("-");
}

export function createBlobStorageJob(
  storageWorkerName: string,
  versionedHash: string
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
      jobId,
    },
  };
}

export function createBlobPropagationFlowJob(
  workerName: string,
  storageWorkerNames: string[],
  versionedHash: string
): FlowJob {
  const jobId = buildJobId(workerName, versionedHash);
  const children = storageWorkerNames.map((storageWorkerName) =>
    createBlobStorageJob(storageWorkerName, versionedHash)
  );

  return {
    name: `propagateBlob:${jobId}`,
    queueName: workerName,
    data: {
      versionedHash,
    },
    opts: {
      ...DEFAULT_JOB_OPTIONS,
      jobId,
    },
    children,
  };
}

export async function propagateBlob(
  versionedHash: string,
  targetStorage: $Enums.BlobStorage,
  { blobStorageManager }: { blobStorageManager: BlobStorageManager }
) {
  const blobData = await blobFileManager.readFile(versionedHash);

  const result = await blobStorageManager.storeBlob(
    {
      data: blobData,
      versionedHash,
    },
    {
      selectedStorages: [targetStorage],
    }
  );

  const storageRef = result.references[0];

  if (!storageRef) {
    throw new Error(
      `Blob reference missing when storing ${versionedHash} in ${targetStorage}`
    );
  }

  await prisma.blobDataStorageReference.upsert({
    create: {
      blobStorage: targetStorage,
      blobHash: versionedHash,
      dataReference: storageRef.reference,
    },
    update: {
      dataReference: storageRef.reference,
    },
    where: {
      blobHash_blobStorage: {
        blobHash: versionedHash,
        blobStorage: targetStorage,
      },
    },
  });

  return storageRef;
}
