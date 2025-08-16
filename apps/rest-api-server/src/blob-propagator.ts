import { BlobPropagator } from "@blobscan/blob-propagator";
import type { BlobStorage } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import { createBlobStorages, createStorageFromEnv } from "./blob-storages";

let blobPropagator: BlobPropagator | undefined;

async function getBlobPropagator() {
  if (!blobPropagator) {
    blobPropagator = await createBlobPropagator();
  }

  return blobPropagator;
}

async function createBlobPropagator() {
  const blobStorages = await createBlobStorages();
  let stagingBlobStorage: BlobStorage | undefined = blobStorages.find(
    (storage) => storage.name === env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
  );

  if (!stagingBlobStorage) {
    try {
      stagingBlobStorage = await createStorageFromEnv(
        env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
      );
    } catch (err) {
      throw new Error(`Failed to create staging blob storage: ${err}`);
    }
  }

  return BlobPropagator.create({
    blobStorages,
    prisma,
    stagingBlobStorage,
    redisConnectionOrUri: env.REDIS_URI,
  });
}

export { getBlobPropagator };
