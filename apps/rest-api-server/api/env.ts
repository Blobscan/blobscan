import { z, booleanSchema, createEnv, presetEnvOptions } from "@blobscan/zod";

export const env = createEnv({
  server: {
    BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    METRICS_ENABLED: booleanSchema.default("true"),
    TRACES_ENABLED: booleanSchema.default("false"),
  },

  ...presetEnvOptions,
});
