import {
  z,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
  booleanSchema,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      SECRET_KEY: z.string(),
      NODE_ENV: nodeEnvSchema.optional(),
      METRICS_ENABLED: booleanSchema.default("false"),
      BLOB_PROPAGATOR_ENABLED: z.boolean().default(false),
    },

    ...presetEnvOptions,
  },
});
