import { booleanSchema, createEnv, presetEnvOptions, z } from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      LOGGER_LEVEL: z
        .enum(["error", "warn", "info", "http", "debug"])
        .default("info"),
      TEST: booleanSchema.optional(),
    },

    ...presetEnvOptions,
  },
});
