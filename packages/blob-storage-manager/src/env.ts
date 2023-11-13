import { z, booleanSchema, createEnv, presetEnvOptions } from "@blobscan/zod";

function getMainStorage(env: Partial<Environment>) {
  if (env.MAIN_STORAGE) {
    return env.MAIN_STORAGE;
  }

  if (env.GOOGLE_STORAGE_ENABLED) {
    return "GOOGLE";
  }

  if (env.POSTGRES_STORAGE_ENABLED) {
    return "POSTGRES";
  }

  if (env.SWARM_STORAGE_ENABLED) {
    return "SWARM";
  }
}

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
      `Blob storage manager configuration: chainId=${
        env.CHAIN_ID
      }, mainStorage=${getMainStorage(env)} postgres=${
        env.POSTGRES_STORAGE_ENABLED
      }, gcs=${env.GOOGLE_STORAGE_ENABLED}, swarm=${env.SWARM_STORAGE_ENABLED}`
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

export type Environment = typeof env;
