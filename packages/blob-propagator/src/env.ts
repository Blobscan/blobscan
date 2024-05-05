import {
  blobStorageSchema,
  booleanSchema,
  createEnv,
  maskPassword,
  presetEnvOptions,
  z,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      REDIS_URI: z.string().default("redis://localhost:6379"),

      POSTGRES_STORAGE_ENABLED: booleanSchema.default("false"),
      GOOGLE_STORAGE_ENABLED: booleanSchema.default("false"),
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),
      BLOB_PROPAGATOR_ENABLED: booleanSchema.default("false"),
      BLOB_PROPAGATOR_TMP_BLOB_STORAGE:
        blobStorageSchema.default("FILE_SYSTEM"),
      BLOB_PROPAGATOR_COMPLETED_JOBS_AGE: z.coerce
        .number()
        .default(24 * 60 * 60),
      BLOB_PROPAGATOR_FAILED_JOBS_AGE: z.coerce
        .number()
        .default(7 * 24 * 60 * 60),
      FILE_SYSTEM_STORAGE_PATH: z.string().optional(),
      TEST: booleanSchema.optional(),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `Blob propagator configuration: enabled=${
        env.BLOB_PROPAGATOR_ENABLED
      } redisUri=${maskPassword(env.REDIS_URI)} temporalBlobStorage=${
        env.BLOB_PROPAGATOR_TMP_BLOB_STORAGE
      } completedJobsAge=${
        env.BLOB_PROPAGATOR_COMPLETED_JOBS_AGE
      } seconds failedJobsAge=${env.BLOB_PROPAGATOR_FAILED_JOBS_AGE} seconds`
    );
  },
});

export type EnvVars = typeof env;
