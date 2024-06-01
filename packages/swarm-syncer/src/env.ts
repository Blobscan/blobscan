import {
  booleanSchema,
  createEnv,
  presetEnvOptions,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),
    },

    ...presetEnvOptions,
  },
});

export type EnvVars = typeof env;
