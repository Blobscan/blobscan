import type { Worker } from "bullmq";
import { Queue } from "bullmq";

import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma, $Enums } from "@blobscan/db";

import { blobFileManager } from "./blob-file-manager";

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

export function buildJobId(queue: Queue | Worker, blobHash: string) {
  return `${queue.name}-${blobHash}`;
}

export function getStorageFromjobId(jobId: string) {
  return Object.entries(STORAGE_WORKER_NAMES).find(([, name]) =>
    jobId.startsWith(name)
  )?.[0] as $Enums.BlobStorage;
}

export async function emptyWorkerJobQueue(worker: Worker) {
  const q = new Queue(worker.name, {
    connection: await worker.client,
  });

  return q.drain();
}

export async function propagateBlob(
  versionedHash: string,
  targetStorage: $Enums.BlobStorage
) {
  const blobStorageManager = await getBlobStorageManager();
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
