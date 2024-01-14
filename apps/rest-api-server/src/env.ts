import {
  z,
  booleanSchema,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      BLOBSCAN_API_PORT: z.coerce.number().positive().default(3001),
      NODE_ENV: nodeEnvSchema.optional(),
      TRACES_ENABLED: booleanSchema.default("false"),
      METRICS_ENABLED: booleanSchema.default("false"),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `Configuration: metrics=${env.METRICS_ENABLED}, traces=${env.TRACES_ENABLED}, port=${env.BLOBSCAN_API_PORT}`
    );
  },
});
