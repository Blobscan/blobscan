import { BlobPropagator } from "@blobscan/blob-propagator";
import type { BlobStorage } from "@blobscan/blob-storage-manager";
import { env } from "@blobscan/env";
import { logger } from "@blobscan/logger";

import { createBlobStorages } from "./blob-storages";
import { prisma } from "./clients/prisma";
import { redis } from "./clients/redis";

let blobPropagator: BlobPropagator | undefined;

async function getBlobPropagator() {
  if (!blobPropagator) {
    blobPropagator = await createBlobPropagator();

    logger.info("Blob propagator service set up!");
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
      `Primary blob storage "${env.PRIMARY_BLOB_STORAGE}" was not created. Make sure it's enabled and all required parameters are set.`
    );
  }

  return BlobPropagator.create({
    blobStorages,
    prisma,
    primaryBlobStorage,
    redisConnectionOrUri: redis,
    enableReconciler: env.BLOB_RECONCILER_ENABLED,
    reconcilerConfig: {
      cronPattern: env.BLOB_RECONCILER_CRON_PATTERN,
      batchSize: env.BLOB_RECONCILER_BATCH_SIZE,
    },
    workerOptions: {
      removeOnComplete: {
        age: env.BLOB_PROPAGATOR_COMPLETED_JOBS_AGE,
      },
      removeOnFail: {
        age: env.BLOB_PROPAGATOR_FAILED_JOBS_AGE,
      },
    },
  });
}

export { getBlobPropagator };
