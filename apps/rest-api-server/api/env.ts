import { logger } from "@blobscan/logger";
import { z, createEnv, presetEnvOptions } from "@blobscan/zod";

export const env = createEnv({
  server: {
    BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    METRICS_ENABLED: z.coerce.boolean().default(true),
    TRACES_ENABLED: z.coerce.boolean().default(false),
  },

  ...presetEnvOptions,
});

logger.info(
  `Blobscan API server configuration: metrics=${env.METRICS_ENABLED}, traces=${env.TRACES_ENABLED}, port=${env.BLOBSCAN_API_PORT}`
);
