import type { Worker } from "bullmq";
import { Queue } from "bullmq";

import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import type { $Enums } from "@blobscan/db";

import { blobFileManager } from "./blob-file-manager";

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
  const blobData = await blobFileManager.readBlobDataFile(versionedHash);

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
