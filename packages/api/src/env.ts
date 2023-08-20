import {
  z,
  createEnv,
  makeOptional,
  nodeEnvSchema,
  presetEnvOptions,
} from "@blobscan/zod";

export const env = createEnv({
  server: {
    SECRET_KEY: z.string(),
    NODE_ENV: makeOptional(nodeEnvSchema),
  },

  ...presetEnvOptions,
});
