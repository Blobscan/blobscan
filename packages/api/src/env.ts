import {
  z,
  createEnv,
  presetEnvOptions,
  nodeEnvSchema,
  booleanSchema,
  maskSensitiveData,
} from "@blobscan/zod";

export const env = createEnv({
  envOptions: {
    server: {
      SECRET_KEY: z.string(),
      NODE_ENV: nodeEnvSchema.optional(),
      METRICS_ENABLED: booleanSchema.default("false"),
      BLOB_PROPAGATOR_ENABLED: booleanSchema.default("false"),
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `API configuration: secretKey: ${maskSensitiveData(
        env.SECRET_KEY
      )}, blobPropagatorEnabled=${env.BLOB_PROPAGATOR_ENABLED}`
    );
  },
});
