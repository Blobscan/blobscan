import type { FlowChildJob, FlowJob, JobsOptions } from "bullmq";

import type { BlobReference } from "@blobscan/blob-storage-manager";
import { $Enums } from "@blobscan/db";

import type {
  BlobPropagationJobData,
  BlobPropagationWorkerParams,
} from "./types";

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
  { versionedHash }: BlobPropagationJobData,
  targetStorage: $Enums.BlobStorage,
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
      throw new Error(`Data not found for blob ${versionedHash}`);
    }

    const result = await blobStorageManager.getBlobByReferences(...blobRefs);

    blobData = result.data;
  }

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
