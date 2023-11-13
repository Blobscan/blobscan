import { BlobStorageManager } from "./BlobStorageManager";
import { env } from "./env";
import { GoogleStorage, PostgresStorage, SwarmStorage } from "./storages";

let blobStorageManager: BlobStorageManager | undefined;

export async function createOrLoadBlobStorageManager(): Promise<BlobStorageManager> {
  if (!blobStorageManager) {
    const googleStorage = await GoogleStorage.tryCreateFromEnv(env);
    const postgresStorage = await PostgresStorage.tryCreateFromEnv(env);
    const swarmStorage = await SwarmStorage.tryCreateFromEnv(env);

    const bsmOptions = env.MAIN_STORAGE
      ? { mainStorage: env.MAIN_STORAGE }
      : undefined;

    blobStorageManager = new BlobStorageManager(
      {
        GOOGLE: googleStorage,
        POSTGRES: postgresStorage,
        SWARM: swarmStorage,
      },
      env.CHAIN_ID,
      bsmOptions
    );
  }

  return blobStorageManager;
}
