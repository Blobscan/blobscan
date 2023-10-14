import { createEnv, nodeEnvSchema, presetEnvOptions, z } from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      NODE_ENV: nodeEnvSchema.optional(),
    },

    ...presetEnvOptions,
  },
});
