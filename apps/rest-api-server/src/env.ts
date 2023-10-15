import {
  z,
  booleanSchema,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
      NODE_ENV: nodeEnvSchema.optional(),
      METRICS_ENABLED: booleanSchema.default("true"),
      TRACES_ENABLED: booleanSchema.default("false"),
    },

    ...presetEnvOptions,
  },
});
