import { createOrLoadBlobStorageManager } from "@blobscan/blob-storage-manager";
import type { BlobStorage } from "@blobscan/db";

import { readBlobDataFile } from "../blob-data-file";

export async function replicateBlob(
  versionedHash: string,
  targetStorage: BlobStorage
) {
  const blobStorageManager = await createOrLoadBlobStorageManager();
  const blobData = await readBlobDataFile(versionedHash);

  const result = await blobStorageManager.storeBlob(
    {
      data: blobData,
      versionedHash,
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
