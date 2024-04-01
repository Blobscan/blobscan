import {
  z,
  booleanSchema,
  createEnv,
  presetEnvOptions,
  maskSensitiveData,
} from "@blobscan/zod";

export function parseEnv() {
  return createEnv({
    envOptions: {
      server: {
        BEE_DEBUG_ENDPOINT: z.string().url().optional(),
        BEE_ENDPOINT: z.string().url().optional(),
        CHAIN_ID: z.coerce.number().positive().default(1),
        FILE_SYSTEM_STORAGE_BLOB_DIR_PATH: z.string().optional(),
        GOOGLE_STORAGE_BUCKET_NAME: z.string().optional(),
        GOOGLE_STORAGE_PROJECT_ID: z.string().optional(),
        GOOGLE_SERVICE_KEY: z.string().optional(),
        GOOGLE_STORAGE_API_ENDPOINT: z.string().optional(),
        GOOGLE_STORAGE_ENABLED: booleanSchema.default("false"),
        POSTGRES_STORAGE_ENABLED: booleanSchema.default("true"),
        SWARM_STORAGE_ENABLED: booleanSchema.default("false"),
      },

      ...presetEnvOptions,
    },
    display(env) {
      console.log(
        `Blob storage manager configuration: chainId=${env.CHAIN_ID}, postgres=${env.POSTGRES_STORAGE_ENABLED}, gcs=${env.GOOGLE_STORAGE_ENABLED}, swarm=${env.SWARM_STORAGE_ENABLED}`
      );

      if (env.GOOGLE_STORAGE_ENABLED) {
        console.log(
          `GCS configuration: bucketName=${
            env.GOOGLE_STORAGE_BUCKET_NAME
          }, projectId=${maskSensitiveData(
            env.GOOGLE_STORAGE_PROJECT_ID
          )}, apiEndpoint=${env.GOOGLE_STORAGE_API_ENDPOINT}`
        );
      }

      if (env.SWARM_STORAGE_ENABLED) {
        console.log(
          `Swarm configuration: beeEndpoint=${env.BEE_ENDPOINT}, debugEndpoint=${env.BEE_DEBUG_ENDPOINT}`
        );
      }
    },
  });
}
export const env = parseEnv();

export type Environment = typeof env;
