import { prisma } from "@blobscan/db";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import { env } from "@blobscan/env";

import type { BlobStorage } from "../BlobStorage";
import {
  ChunkstormStorage,
  FileSystemStorage,
  GoogleStorage,
  PostgresStorage,
  SwarmStorage,
  WeaveVMStorage,
} from "../storages";

export function removeDuplicatedStorages(
  blobStorages: BlobStorage[]
): BlobStorage[] {
  return blobStorages.filter(
    (blobStorage, index, self) =>
      index === self.findIndex((t) => t.name === blobStorage.name)
  );
}

export async function createStorageFromEnv(
  storageName: BlobStorageName
): Promise<BlobStorage> {
  const chainId = env.CHAIN_ID;

  switch (storageName) {
    case BlobStorageName.GOOGLE: {
      if (
        !env.GOOGLE_STORAGE_BUCKET_NAME ||
        (!env.GOOGLE_SERVICE_KEY && !env.GOOGLE_STORAGE_API_ENDPOINT)
      ) {
        throw new Error(
          "Missing required env variables for GoogleStorage: GOOGLE_STORAGE_BUCKET_NAME, GOOGLE_SERVICE_KEY or GOOGLE_STORAGE_API_ENDPOINT"
        );
      }

      const googleStorage = await GoogleStorage.create({
        chainId,
        bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
        apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
        projectId: env.GOOGLE_STORAGE_PROJECT_ID,
        serviceKey: env.GOOGLE_SERVICE_KEY,
      });

      return googleStorage;
    }
    case BlobStorageName.POSTGRES: {
      const postgresStorage = await PostgresStorage.create({ chainId });

      return postgresStorage;
    }
    case BlobStorageName.SWARM: {
      if (!env.BEE_ENDPOINT) {
        throw new Error(
          "Missing required env variable for SwarmStorage: BEE_ENDPOINT"
        );
      }

      const swarmStorage = await SwarmStorage.create({
        chainId,
        beeEndpoint: env.BEE_ENDPOINT,
        prisma,
      });

      return swarmStorage;
    }
    case BlobStorageName.CHUNKSTORM: {
      if (!env.BEE_ENDPOINT || !env.CHUNKSTORM_URL) {
        throw new Error(
          "Missing required env variables for ChunkstormStorage: BEE_ENDPOINT and CHUNKSTORM_STORAGE_API_BASE_URL"
        );
      }

      const chunkstormStorage = await ChunkstormStorage.create({
        chainId,
        apiBaseUrl: env.CHUNKSTORM_URL,
        beeEndpoint: env.BEE_ENDPOINT,
        prisma,
      });

      return chunkstormStorage;
    }
    case BlobStorageName.FILE_SYSTEM: {
      const fileSystemStorage = await FileSystemStorage.create({
        chainId,
        blobDirPath: env.FILE_SYSTEM_STORAGE_PATH,
      });

      return fileSystemStorage;
    }
    case BlobStorageName.WEAVEVM: {
      if (!env.WEAVEVM_STORAGE_API_BASE_URL) {
        throw new Error(
          "Missing required env variable for WeavevmStorage: WEAVEVM_STORAGE_API_BASE_URL"
        );
      }

      const weavevmStorage = await WeaveVMStorage.create({
        chainId,
        apiBaseUrl: env.WEAVEVM_STORAGE_API_BASE_URL,
      });

      return weavevmStorage;
    }
  }
}
