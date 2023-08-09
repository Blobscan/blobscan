import { z } from "zod";

import { booleanSchema, createEnvSchema } from "@blobscan/zod";

const envSchema = createEnvSchema({
  SECRET_KEY: { schema: z.string() },
  OTEL_SDK_DISABLED: {
    schema: booleanSchema(),
    optional: true,
    default: false,
  },
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
