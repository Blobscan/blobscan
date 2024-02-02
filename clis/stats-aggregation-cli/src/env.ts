import { createEnv, z, presetEnvOptions } from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      BEACON_NODE_ENDPOINT: z.string().url().optional(),
    },

    ...presetEnvOptions,
  },
});
