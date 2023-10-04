import { logger } from "@blobscan/logger";
import {
  z,
  booleanSchema,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
} from "@blobscan/zod";

export const env = createEnv({
  server: {
    BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
    NODE_ENV: nodeEnvSchema.optional(),
    METRICS_ENABLED: booleanSchema.default("true"),
    TRACES_ENABLED: booleanSchema.default("false"),
  },

  ...presetEnvOptions,
});

logger.info(
  `Blobscan API server configuration: metrics=${env.METRICS_ENABLED}, traces=${env.TRACES_ENABLED}, port=${env.BLOBSCAN_API_PORT}`
);
