import type { BlobReference } from "@blobscan/blob-storage-manager";
import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import { BlobStorage } from "@blobscan/db";

export const BLOB_STORAGES = Object.values(BlobStorage);

export async function replicateBlob(
  originStorageRef: BlobReference,
  targetStorage: BlobStorage,
  versionedHash: string
) {
  const blobStorageManager = await createOrLoadBlobStorageManager();

  const blobData = await blobStorageManager
    .getBlob(originStorageRef)
    .then((r) => r?.data);

  if (!blobData) {
    throw new Error(`Couldn't find blob ${versionedHash} in storage GOOGLE`);
  }

  const result = await blobStorageManager.storeBlob(
    {
      data: blobData,
      versionedHash: versionedHash,
    },
    {
      storages: [targetStorage],
    }
  );

  if (result.errors.length) {
    throw new Error(
      `Couldn't store blob ${versionedHash} in storage ${targetStorage}: ${result.errors.join(
        ", "
      )}`
    );
  }

  const storageRef = result.references[0];

  if (!storageRef) {
    throw new Error(
      `Blob reference missing when storing ${versionedHash} in ${targetStorage}`
    );
  }

  return storageRef;
}
