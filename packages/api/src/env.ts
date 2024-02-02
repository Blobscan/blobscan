import { env as blobPropagatorEnv } from "@blobscan/blob-propagator";
import { env as blobStorageManagerEnv } from "@blobscan/blob-storage-manager";
import { env as openTelemetryEnv } from "@blobscan/open-telemetry";
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
    },

    ...presetEnvOptions,
  },
  display(env) {
    console.log(
      `API configuration: secretKey: ${maskSensitiveData(env.SECRET_KEY)}`
    );
    blobPropagatorEnv.display();
    blobStorageManagerEnv.display();
    openTelemetryEnv.display();
  },
});
