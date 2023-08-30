import {
  z,
  booleanSchema,
  createEnv,
  makeOptional,
  presetEnvOptions,
} from "@blobscan/zod";

export const env = createEnv({
  server: {
    BEE_DEBUG_ENDPOINT: makeOptional(z.string().url()),
    BEE_ENDPOINT: makeOptional(z.string().url()),
    CHAIN_ID: z.coerce().number().default(1),
    GOOGLE_STORAGE_BUCKET_NAME: makeOptional(z.string()),
    GOOGLE_STORAGE_PROJECT_ID: makeOptional(z.string()),
    GOOGLE_SERVICE_KEY: makeOptional(z.string()),
    GOOGLE_STORAGE_API_ENDPOINT: makeOptional(z.string().url()),
    GOOGLE_STORAGE_ENABLED: makeOptional(booleanSchema, false),
    POSTGRES_STORAGE_ENABLED: makeOptional(booleanSchema, true),
    SWARM_STORAGE_ENABLED: makeOptional(booleanSchema, false),
  },

  ...presetEnvOptions,
});

export type Environment = typeof env;
