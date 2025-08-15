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
      const stagingBlobStorage = await createStorageFromEnv(
        env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
      );

      if (stagingBlobStorage) {
        blobStorageManager.addStorage(stagingBlobStorage);
      }
    } catch (err) {
      throw new Error(`Failed to create staging blob storage: ${err}`);
    }
  }

  return BlobPropagator.create({
    blobStorageManager,
    prisma,
    stagingBlobStorageName: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
    redisConnectionOrUri: env.REDIS_URI,
  });
}

export { getBlobPropagator };
