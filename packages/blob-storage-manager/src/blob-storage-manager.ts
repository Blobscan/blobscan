import { BlobStorage as BLOB_STORAGE_NAMES } from "@blobscan/db";
import { logger } from "@blobscan/logger";

import type { BlobStorage } from "./BlobStorage";
import { BlobStorageManager } from "./BlobStorageManager";
import { Environment, env } from "./env";
import { createStorageFromEnv } from "./utils";

let blobStorageManager: BlobStorageManager | undefined;

async function createBlobStorageManager() {
  const blobStorages = await Promise.all(
    Object.values(BLOB_STORAGE_NAMES).map(async (storageName) => {
      if (env[`${storageName}_STORAGE_ENABLED` as keyof Environment] === true) {
        let [storage, storageError] = await createStorageFromEnv(storageName);

        if (storageError) {
          logger.warn(
            `${storageError.message}. Caused by: ${storageError.cause}`
          );
        }

        return storage;
      }
    })
  );

  const availableStorages = blobStorages.filter(
    (storage): storage is BlobStorage => !!storage
  );

  return new BlobStorageManager(availableStorages, env.CHAIN_ID);
}

export async function getBlobStorageManager(): Promise<BlobStorageManager> {
  if (!blobStorageManager) {
    blobStorageManager = await createBlobStorageManager();
  }

  return blobStorageManager;
}
