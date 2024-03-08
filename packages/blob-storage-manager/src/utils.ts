import { $Enums } from "@blobscan/db";

import type { BlobStorage } from "./BlobStorage";
import { env } from "./env";
import type { StorageCreationError } from "./errors";
import { GoogleStorage, PostgresStorage, SwarmStorage } from "./storages";
import type { BlobStorageName } from "./types";

export const BLOB_STORAGE_NAMES = $Enums.BlobStorage;

export function removeDuplicatedStorages(
  blobStorages: BlobStorage[]
): BlobStorage[] {
  return blobStorages.filter(
    (blobStorage, index, self) =>
      index === self.findIndex((t) => t.name === blobStorage.name)
  );
}

export function calculateBlobBytes(blob: string): number {
  return blob.slice(2).length / 2;
}

export async function createStorageFromEnv(
  storageName: BlobStorageName
): Promise<[BlobStorage | undefined, StorageCreationError | undefined]> {
  let storage: BlobStorage | undefined;
  let storageError: StorageCreationError | undefined;

  switch (storageName) {
    case BLOB_STORAGE_NAMES.GOOGLE:
      [storage, storageError] = await GoogleStorage.tryCreateFromEnv(env);
      break;
    case BLOB_STORAGE_NAMES.POSTGRES:
      [storage, storageError] = await PostgresStorage.tryCreateFromEnv(env);
      break;
    case BLOB_STORAGE_NAMES.SWARM:
      [storage, storageError] = await SwarmStorage.tryCreateFromEnv(env);
      break;
  }

  return [storage, storageError];
}
