import { prisma } from "@blobscan/db";

import { BlobStorageManagerBuilder } from "./BlobStorageManagerBuilder";
import { env } from "./env";
import { GoogleStorage, PrismaStorage, SwarmStorage } from "./storages";

const googleStorage =
  env.GOOGLE_SERVICE_KEY || env.GOOGLE_STORAGE_API_ENDPOINT
    ? new GoogleStorage({
        bucketName: env.GOOGLE_STORAGE_BUCKET_NAME,
        projectId: env.GOOGLE_STORAGE_PROJECT_ID,
        serviceKey: env.GOOGLE_SERVICE_KEY,
        apiEndpoint: env.GOOGLE_STORAGE_API_ENDPOINT,
      })
    : null;
const swarmStorage =
  env.BEE_DEBUG_ENDPOINT && env.BEE_ENDPOINT
    ? new SwarmStorage({
        beeDebugEndpoint: env.BEE_DEBUG_ENDPOINT,
        beeEndpoint: env.BEE_ENDPOINT,
      })
    : null;
// Fallback to prisma if no storage is available
const prismaStorage =
  !googleStorage && !swarmStorage ? new PrismaStorage(prisma) : null;

const blobStorageManager = BlobStorageManagerBuilder.create(env.CHAIN_ID)
  .addStorage("GOOGLE", googleStorage)
  .addStorage("SWARM", swarmStorage)
  .addStorage("PRISMA", prismaStorage)
  .build();

export type { BlobReference } from "./BlobStorageManager";
export {
  blobStorageManager,
  BlobStorageManagerBuilder,
  GoogleStorage,
  SwarmStorage,
  PrismaStorage,
};
