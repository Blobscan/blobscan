import {
  z,
  booleanSchema,
  createEnv,
  presetEnvOptions,
  maskSensitiveData,
  conditionalRequiredSchema,
} from "@blobscan/zod";

import type { BlobStorageName } from "./types";

export function requiredStorageConfigSchema<T extends z.ZodTypeAny>(
  storageName: BlobStorageName,
  schema: T
) {
  return conditionalRequiredSchema(
    schema,
    process.env[`${storageName}_STORAGE_ENABLED`],
    "true",
    `This configuration variable is required when ${storageName} storage is enabled.`
  );
}

export function parseEnv() {
  return createEnv({
    envOptions: {
      server: {
        BEE_ENDPOINT: requiredStorageConfigSchema("SWARM", z.string().url()),
        CHAIN_ID: z.coerce.number().positive().default(1),
        FILE_SYSTEM_STORAGE_ENABLED: booleanSchema.default("false"),
        FILE_SYSTEM_STORAGE_PATH: z.string().default("/tmp/blobscan-blobs"),
        GOOGLE_STORAGE_BUCKET_NAME: requiredStorageConfigSchema(
          "GOOGLE",
          z.string()
        ),
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
        `Blob storage manager configuration: chainId=${env.CHAIN_ID}, file_system=${env.FILE_SYSTEM_STORAGE_ENABLED} postgres=${env.POSTGRES_STORAGE_ENABLED}, gcs=${env.GOOGLE_STORAGE_ENABLED}, swarm=${env.SWARM_STORAGE_ENABLED}`
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
          `Swarm configuration: beeEndpoint=${env.BEE_ENDPOINT}`
        );
      }

      if (env.FILE_SYSTEM_STORAGE_ENABLED) {
        console.log(
          `File system configuration: blobDirPath=${env.FILE_SYSTEM_STORAGE_PATH}`
        );
      }
    },
  });
}
export const env = parseEnv();

export type Environment = typeof env;
