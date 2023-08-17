import { BlobStorageManager } from "./BlobStorageManager";
import { env } from "./env";
import { GoogleStorage, PostgresStorage, SwarmStorage } from "./storages";

let blobStorageManager: BlobStorageManager | undefined;
console.log(env);

async function createOrLoadBlobStorageManager(): Promise<BlobStorageManager> {
  if (!blobStorageManager) {
    const googleStorage = await GoogleStorage.tryCreateFromEnv(env);
    const swarmStorage = await SwarmStorage.tryCreateFromEnv(env);
    const postgresStorage = await PostgresStorage.tryCreateFromEnv(env);

    blobStorageManager = new BlobStorageManager(
      {
        GOOGLE: googleStorage,
        SWARM: swarmStorage,
        POSTGRES: postgresStorage,
      },
      env.CHAIN_ID
    );
  }

  return blobStorageManager;
}

export type { BlobReference } from "./BlobStorageManager";
export {
  createOrLoadBlobStorageManager,
  GoogleStorage,
  SwarmStorage,
  PostgresStorage,
};
