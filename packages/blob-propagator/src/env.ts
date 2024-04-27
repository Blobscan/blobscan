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
      }`
    );
  },
});

export type EnvVars = typeof env;
