import {
  booleanSchema,
  createEnv,
  nodeEnvSchema,
  makeOptional,
  portSchema,
  presetEnvOptions,
} from "@blobscan/zod";

export const env = createEnv({
  server: {
    BLOBSCAN_API_PORT: makeOptional(portSchema, 3001),
    NODE_ENV: makeOptional(nodeEnvSchema),
    METRICS_ENABLED: makeOptional(booleanSchema, true),
    TRACES_ENABLED: makeOptional(booleanSchema, false),
  },

  ...presetEnvOptions,
});
