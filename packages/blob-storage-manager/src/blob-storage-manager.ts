import { BlobStorageManager } from "./BlobStorageManager";
import { env } from "./env";
import { GoogleStorage, PostgresStorage, SwarmStorage } from "./storages";

let blobStorageManager: BlobStorageManager | undefined;

export async function getBlobStorageManager(): Promise<BlobStorageManager> {
  if (!blobStorageManager) {
    const blobStorages = [];
    const [googleStorage, googleStorageError] =
      await GoogleStorage.tryCreateFromEnv(env);
    const [postgresStorage, postgresStorageError] =
      await PostgresStorage.tryCreateFromEnv(env);
    const [swarmStorage, swarmStorageError] =
      await SwarmStorage.tryCreateFromEnv(env);

    if (googleStorage) {
      blobStorages.push(googleStorage);
    }

    if (postgresStorage) {
      blobStorages.push(postgresStorage);
    }

    if (swarmStorage) {
      blobStorages.push(swarmStorage);
    }

    blobStorageManager = new BlobStorageManager(blobStorages, env.CHAIN_ID);
  }

  return blobStorageManager;
}
