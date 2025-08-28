import { BlobPropagator } from "@blobscan/blob-propagator";
import type { BlobStorage } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";

import { createBlobStorages } from "./blob-storages";

let blobPropagator: BlobPropagator | undefined;

async function getBlobPropagator() {
  if (!blobPropagator) {
    blobPropagator = await createBlobPropagator();
  }

  return blobPropagator;
}

async function createBlobPropagator() {
  const allBlobStorages = await createBlobStorages();
  const primaryBlobStorage: BlobStorage | undefined = allBlobStorages.find(
    (storage) => storage.name === env.PRIMARY_BLOB_STORAGE
  );
  const blobStorages = allBlobStorages.filter(
    (b) => b.name !== env.PRIMARY_BLOB_STORAGE
  );

  if (!primaryBlobStorage) {
    throw new Error(
      `Primary blob storage "${env.PRIMARY_BLOB_STORAGE}" not created`
    );
  }

  return BlobPropagator.create({
    blobStorages,
    prisma,
    primaryBlobStorage,
    redisConnectionOrUri: env.REDIS_URI,
    reconciliatorOpts: {
      cronPattern: env.BLOB_RECONCILIATOR_CRON_PATTERN,
      batchSize: env.BLOB_RECONCILIATOR_BATCH_SIZE,
    },
  });
}

export { getBlobPropagator };
