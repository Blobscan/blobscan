import {
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
      BLOB_PROPAGATOR_TMP_STORAGE: z.enum([
        "FILE_SYSTEM",
        "GOOGLE",
        "POSTGRES",
        "SWARM",
      ] as const),
      TEST: booleanSchema.optional(),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `Blob propagator configuration: enabled=${
        env.BLOB_PROPAGATOR_ENABLED
      } redisUri=${maskPassword(env.REDIS_URI)} tmpStorage=${
        env.BLOB_PROPAGATOR_TMP_STORAGE
      }`
    );
  },
});

export type EnvVars = typeof env;
