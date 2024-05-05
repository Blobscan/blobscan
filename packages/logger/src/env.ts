import { booleanSchema, createEnv, presetEnvOptions, z } from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      LOG_LEVEL: z
        .enum(["debug", "http", "info", "warn", "error"])
        .default("http"),
      TEST: booleanSchema.optional(),
    },

    ...presetEnvOptions,
  },
});
