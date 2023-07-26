import { BlobStorageManager } from "./BlobStorageManager";
import { env } from "./env";
import { GoogleStorage, PrismaStorage, SwarmStorage } from "./storages";

let blobStorageManager: BlobStorageManager | undefined;

async function createOrLoadBlobStorageManager(): Promise<BlobStorageManager> {
  if (!blobStorageManager) {
    const googleStorage = await GoogleStorage.tryCreateFromEnv(env);
    const swarmStorage = await SwarmStorage.tryCreateFromEnv(env);
    const prismaStorage = await PrismaStorage.tryCreateFromEnv(env);

    blobStorageManager = new BlobStorageManager(
      {
        GOOGLE: googleStorage,
        SWARM: swarmStorage,
        PRISMA: prismaStorage,
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
  PrismaStorage,
};
