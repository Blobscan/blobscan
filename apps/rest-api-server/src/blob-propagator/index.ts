import { BlobPropagator } from "@blobscan/blob-propagator";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import { getBlobStorageManager } from "../blob-storage-manager";
import { createStorageFromEnv } from "../blob-storage-manager/blob-storages";

let blobPropagator: BlobPropagator | undefined;

async function getBlobPropagator() {
  if (!blobPropagator) {
    blobPropagator = await createBlobPropagator();
  }

  return blobPropagator;
}

async function createBlobPropagator() {
  const blobStorageManager = await getBlobStorageManager();

  if (
    !blobStorageManager
      .getAllStorages()
      .find((storage) => storage.name === env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE)
  ) {
    try {
      const tmpStorage = await createStorageFromEnv(
        env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
      );

      if (tmpStorage) {
        blobStorageManager.addStorage(tmpStorage);
      }
    } catch (err) {
      throw new Error(`Failed to create temporary blob storage: ${err}`);
    }
  }

  return new BlobPropagator({
    blobStorageManager,
    prisma,
    tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
    redisConnectionOrUri: env.REDIS_URI,
  });
}

export { getBlobPropagator };
