import { logger } from "@blobscan/logger";
import { z, booleanSchema, createEnv, presetEnvOptions } from "@blobscan/zod";

export const env = createEnv({
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
  },

  ...presetEnvOptions,
});

logger.info(
  `Blob storage manager configuration: chainId=${env.CHAIN_ID}, postgres=${env.POSTGRES_STORAGE_ENABLED}, gcs=${env.GOOGLE_STORAGE_ENABLED}, swarm=${env.SWARM_STORAGE_ENABLED}`
);

if (env.GOOGLE_STORAGE_ENABLED) {
  logger.info(
    `GCS configuration: bucketName=${env.GOOGLE_STORAGE_BUCKET_NAME}, projectId=${env.GOOGLE_STORAGE_PROJECT_ID}, apiEndpoint=${env.GOOGLE_STORAGE_API_ENDPOINT}`
  );
}

if (env.SWARM_STORAGE_ENABLED) {
  logger.info(
    `Swarm configuration: beeEndpoint=${env.BEE_ENDPOINT}, debugEndpoint=${env.BEE_DEBUG_ENDPOINT}`
  );
}

export type Environment = typeof env;
