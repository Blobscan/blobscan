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
      BEE_DEBUG_ENDPOINT: z.string().url().optional(),
      CHAIN_ID: z.coerce.number().positive().default(1),
      SECRET_KEY: z.string(),
      NODE_ENV: nodeEnvSchema.optional(),
      METRICS_ENABLED: booleanSchema.default("false"),
      SWARM_STORAGE_ENABLED: booleanSchema.default("false"),
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
