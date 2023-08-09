import { z, createEnvSchema, booleanSchema } from "@blobscan/zod";

const envSchema = createEnvSchema({
  BLOBSCAN_API_PORT: {
    schema: z.coerce.number().int().positive(),
    default: 3001,
  },
  NODE_ENV: {
    schema: z.enum(["development", "test", "production"]),
    optional: true,
  },
  OTEL_SDK_DISABLED: {
    schema: booleanSchema(),
    optional: true,
    default: false,
  },
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
