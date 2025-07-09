import { BlobStorageManager } from "@blobscan/blob-storage-manager";

import { createBlobStorages } from "./blob-storages";

let blobStorageManager: BlobStorageManager | undefined;

export async function getBlobStorageManager(): Promise<BlobStorageManager> {
  if (!blobStorageManager) {
    const storages = await createBlobStorages();
    blobStorageManager = new BlobStorageManager(storages);
  }

  return blobStorageManager;
}
