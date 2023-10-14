import { z, createEnv, presetEnvOptions, nodeEnvSchema } from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      SECRET_KEY: z.string(),
      NODE_ENV: nodeEnvSchema.optional(),
    },

    ...presetEnvOptions,
  },
});
