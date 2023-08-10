import { z, createEnvSchema } from "@blobscan/zod";

const envSchema = createEnvSchema({
  OTEL_EXPORTER_OTLP_PROTOCOL: {
    schema: z.enum(["grpc", "http/protobuf", "http/json"]),
    optional: true,
  },
  OTEL_EXPORTER_OTLP_ENDPOINT: {
    schema: z.string().url(),
    optional: true,
  },
  OTLP_AUTH_USERNAME: {
    schema: z.coerce.string(),
    optional: true,
  },
  OTLP_AUTH_PASSWORD: {
    schema: z.string(),
    optional: true,
  },
  NODE_ENV: {
    schema: z.enum(["development", "test", "production"]),
    optional: true,
  },
});

export const env = envSchema.parse(process.env);

export type Environment = z.infer<typeof envSchema>;
