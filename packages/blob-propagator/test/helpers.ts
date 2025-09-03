import {
  GoogleStorage,
  PostgresStorage,
  S3Storage,
  SwarmStorage,
  WeaveVMStorage,
} from "@blobscan/blob-storage-manager";
import type { BlobStorage } from "@blobscan/blob-storage-manager";
import { prisma } from "@blobscan/db";
import { BlobStorage as BlobStorageName } from "@blobscan/db/prisma/enums";
import type { Environment } from "@blobscan/test";
import { env } from "@blobscan/test";

export async function createStorageFromEnv(
  storageName: BlobStorageName
): Promise<BlobStorage> {
  const chainId = env.CHAIN_ID;

  switch (storageName) {
    case BlobStorageName.S3: {
      if (!env.S3_STORAGE_BUCKET_NAME || !env.S3_STORAGE_REGION) {
        throw new Error(
          "Missing required env variables for S3Storage: S3_STORAGE_BUCKET_NAME, S3_STORAGE_REGION"
        );
      }

      return S3Storage.create({
        chainId,
        bucketName: env.S3_STORAGE_BUCKET_NAME,
        region: env.S3_STORAGE_REGION,
        accessKeyId: env.S3_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.S3_STORAGE_SECRET_ACCESS_KEY,
        endpoint: env.S3_STORAGE_ENDPOINT,
        forcePathStyle: env.S3_STORAGE_FORCE_PATH_STYLE,
      });
    }
    case BlobStorageName.GOOGLE: {
      if (
        !env.GOOGLE_STORAGE_BUCKET_NAME ||
        (!env.GOOGLE_SERVICE_KEY && !env.GOOGLE_STORAGE_API_ENDPOINT)
      ) {
        throw new Error(
          "Missing required env variables for GoogleStorage: GOOGLE_STORAGE_BUCKET_NAME, GOOGLE_SERVICE_KEY or GOOGLE_STORAGE_API_ENDPOINT"
        );
      }

      return GoogleStorage.create({
        chainId,
        bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
        apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
        projectId: env.GOOGLE_STORAGE_PROJECT_ID,
        serviceKey: env.GOOGLE_SERVICE_KEY,
      });
    }
    case BlobStorageName.POSTGRES: {
      return PostgresStorage.create({ chainId });
    }
    case BlobStorageName.SWARM: {
      if (!env.BEE_ENDPOINT) {
        throw new Error(
          "Missing required env variable for SwarmStorage: BEE_ENDPOINT"
        );
      }

      return SwarmStorage.create({
        chainId,
        beeEndpoint: env.BEE_ENDPOINT,
        prisma,
      });
    }
    case BlobStorageName.WEAVEVM: {
      if (!env.WEAVEVM_STORAGE_API_BASE_URL) {
        throw new Error(
          "Missing required env variable for WeavevmStorage: WEAVEVM_STORAGE_API_BASE_URL"
        );
      }

      return WeaveVMStorage.create({
        chainId,
        apiBaseUrl: env.WEAVEVM_STORAGE_API_BASE_URL,
      });
    }
    default: {
      throw new Error(`Unsupported storage type: ${storageName}`);
    }
  }
}

function isBlobStorageEnabled(storageName: BlobStorageName) {
  const storageEnabledKey =
    `${storageName}_STORAGE_ENABLED` as keyof Environment;
  const storageEnabled = env[storageEnabledKey];

  return storageEnabled === true || storageEnabled === "true";
}

export function createBlobStorages() {
  const enabledBlobStorages = Object.values(BlobStorageName).filter(
    (storageName) => isBlobStorageEnabled(storageName)
  );
  return Promise.all(
    enabledBlobStorages.map((storageName) => createStorageFromEnv(storageName))
  );
}
