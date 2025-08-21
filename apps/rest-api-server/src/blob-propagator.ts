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
  let incomingBlobStorage: BlobStorage | undefined = blobStorages.find(
    (storage) => storage.name === env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
  );

  // The incoming blob storage may not be part of the enabled storages since it's meant
  // to act only as a temporary storage. In that case, we create it separately
  if (!incomingBlobStorage) {
    try {
      incomingBlobStorage = await createStorageFromEnv(
        env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
      );
    } catch (err) {
      throw new Error(`Failed to create incoming blob storage: ${err}`);
    }
  }

  return BlobPropagator.create({
    blobStorages,
    prisma,
    incomingBlobStorage,
    redisConnectionOrUri: env.REDIS_URI,
    reconciliatorOpts: {
      cronPattern: env.BLOB_RECONCILIATOR_CRON_PATTERN,
      batchSize: env.BLOB_RECONCILIATOR_BATCH_SIZE,
    },
  });
}

export { getBlobPropagator };
