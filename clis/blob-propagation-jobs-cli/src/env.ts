import {
  createEnv,
  z,
  presetEnvOptions,
  booleanSchema,
  prismaBatchOperationsMaxSizeSchema,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      REDIS_URI: z.string().default("redis://localhost:6379/1"),

      POSTGRES_STORAGE_ENABLED: booleanSchema.default("false"),
      GOOGLE_STORAGE_ENABLED: booleanSchema.default("false"),
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),

      PRISMA_BATCH_OPERATIONS_MAX_SIZE: prismaBatchOperationsMaxSizeSchema,
    },

    ...presetEnvOptions,
  },
});
