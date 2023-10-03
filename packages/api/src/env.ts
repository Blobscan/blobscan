import { z, createEnv, presetEnvOptions } from "@blobscan/zod";

export const env = createEnv({
  server: {
    FEEDBACK_WEBHOOK_URL: z.string().optional(),
    SECRET_KEY: z.string(),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  },

  ...presetEnvOptions,
});
