import {
  booleanSchema,
  createEnv,
  maskSensitiveData,
  presetEnvOptions,
  z,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      REDIS_QUEUE_HOST: z.string().default("localhost"),
      REDIS_QUEUE_PORT: z.coerce.number().default(6379),
      REDIS_QUEUE_PASSWORD: z.string().optional(),
      REDIS_QUEUE_USERNAME: z.string().optional(),

      POSTGRES_STORAGE_ENABLED: booleanSchema.default("false"),
      GOOGLE_STORAGE_ENABLED: booleanSchema.default("false"),
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),

      BLOB_PROPAGATOR_ENABLED: booleanSchema.default("false"),
      TEST: booleanSchema.optional(),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `Blob propagator configuration: enabled=${
        env.BLOB_PROPAGATOR_ENABLED
      } redisQueueHost=${env.REDIS_QUEUE_HOST}, redisQueuePort=${
        env.REDIS_QUEUE_PORT
      } redisQueuePassword=${maskSensitiveData(
        env.REDIS_QUEUE_PASSWORD
      )}, redisQueueUsername=${env.REDIS_QUEUE_USERNAME}`
    );
  },
});

export type EnvVars = typeof env;
