import type { BlobStorage } from "@blobscan/db";
import { z, booleanSchema, createEnv, presetEnvOptions } from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      BEE_DEBUG_ENDPOINT: z.string().url().default("http://localhost:1635"),
      BEE_ENDPOINT: z.string().url().default("http://localhost:1633"),
      CHAIN_ID: z.coerce.number().positive().default(1),
      GOOGLE_STORAGE_BUCKET_NAME: z.string().optional(),
      GOOGLE_STORAGE_PROJECT_ID: z.string().optional(),
      GOOGLE_SERVICE_KEY: z.string().optional(),
      GOOGLE_STORAGE_API_ENDPOINT: z.string().optional(),
      GOOGLE_STORAGE_ENABLED: booleanSchema.default("false"),
      POSTGRES_STORAGE_ENABLED: booleanSchema.default("true"),
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),
      MAIN_STORAGE: z.enum(["POSTGRES", "SWARM", "GOOGLE"]).optional(),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `Blob storage manager configuration: chainId=${env.CHAIN_ID}, postgres=${env.POSTGRES_STORAGE_ENABLED}, gcs=${env.GOOGLE_STORAGE_ENABLED}, swarm=${env.SWARM_STORAGE_ENABLED}`
    );

    if (env.GOOGLE_STORAGE_ENABLED) {
      console.log(
        `GCS configuration: bucketName=${env.GOOGLE_STORAGE_BUCKET_NAME}, projectId=${env.GOOGLE_STORAGE_PROJECT_ID}, apiEndpoint=${env.GOOGLE_STORAGE_API_ENDPOINT}`
      );
    }

    if (env.SWARM_STORAGE_ENABLED) {
      console.log(
        `Swarm configuration: beeEndpoint=${env.BEE_ENDPOINT}, debugEndpoint=${env.BEE_DEBUG_ENDPOINT}`
      );
    }
  },
});

const enabledStorages: BlobStorage[] = [];

if (env.GOOGLE_STORAGE_ENABLED) {
  enabledStorages.push("GOOGLE");
}

if (env.POSTGRES_STORAGE_ENABLED) {
  enabledStorages.push("POSTGRES");
}

if (env.SWARM_STORAGE_ENABLED) {
  enabledStorages.push("SWARM");
}

export const MAIN_STORAGE =
  env.MAIN_STORAGE ??
  // Fallback to one of the enabled storages if none was defined as the main one
  enabledStorages[0];

export type Environment = typeof env;
