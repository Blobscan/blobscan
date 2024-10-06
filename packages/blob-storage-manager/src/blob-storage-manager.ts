import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";
import type { Environment } from "@blobscan/env";

import type { BlobStorage } from "./BlobStorage";
import { BlobStorageManager } from "./BlobStorageManager";
import { createStorageFromEnv } from "./utils";

let blobStorageManager: BlobStorageManager | undefined;

function isBlobStorageEnabled(storageName: BlobStorageName) {
  const storageEnabledKey =
    `${storageName}_STORAGE_ENABLED` as keyof Environment;
  const storageEnabled = env[storageEnabledKey];

  return storageEnabled === true || storageEnabled === "true";
}

export async function createBlobStorageManager() {
  const blobStorages = await Promise.all(
    Object.values(BlobStorageName).map(async (storageName) => {
      if (isBlobStorageEnabled(storageName)) {
        const storage = await createStorageFromEnv(storageName);

        return storage;
      }
    })
  ).then((storages) =>
    storages.filter((storage): storage is BlobStorage => !!storage)
  );

  return new BlobStorageManager(blobStorages);
}

export async function getBlobStorageManager(): Promise<BlobStorageManager> {
  if (!blobStorageManager) {
    blobStorageManager = await createBlobStorageManager();
  }

  return blobStorageManager;
}
