import { z, createEnv, presetEnvOptions } from "@blobscan/zod";

export const env = createEnv({
  server: {
    SECRET_KEY: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  },

  ...presetEnvOptions,
});
