import { getBlobStorageManager } from "@blobscan/blob-storage-manager";
import type { $Enums } from "@blobscan/db";

import { blobFileManager } from "./blob-file-manager";

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

  return storageRef;
}
