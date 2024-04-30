import IORedis from "ioredis";

import {
  createStorageFromEnv,
  getBlobStorageManager,
} from "@blobscan/blob-storage-manager";
import type { BlobStorageManager } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import type { BlobscanPrismaClient } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import { BlobPropagator } from "./BlobPropagator";
import { env } from "./env";

async function createBlobPropagator(
  blobStorageManager: BlobStorageManager,
  prisma: BlobscanPrismaClient
) {
  const connection = new IORedis(env.REDIS_URI, { maxRetriesPerRequest: null });

  if (
    !blobStorageManager
      .getAllStorages()
      .find((storage) => storage.name === env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE)
  ) {
    const [tmpStorage, tmpStorageError] = await createStorageFromEnv(
      env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
    );

    if (tmpStorageError) {
      logger.warn(
        `${tmpStorageError.message}. Caused by: ${tmpStorageError.cause}`
      );
    }

    if (tmpStorage) {
      blobStorageManager.addStorage(tmpStorage);
    }
  }

  return new BlobPropagator({
    blobStorageManager,
    prisma,
    tmpBlobStorage: env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE,
    workerOptions: {
      connection,
    },
  });
}

let blobPropagator: BlobPropagator | undefined;

async function getBlobPropagator() {
  if (!env.BLOB_PROPAGATOR_ENABLED) {
    return;
  }

  if (!blobPropagator) {
    const blobStorageManager = await getBlobStorageManager();

    blobPropagator = await createBlobPropagator(blobStorageManager, prisma);
  }

  return blobPropagator;
}

export { getBlobPropagator, createBlobPropagator };
