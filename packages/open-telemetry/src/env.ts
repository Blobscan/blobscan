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
  GRAFANA_INSTANCE_ID: {
    schema: z.coerce.number().int().positive(),
    optional: true,
  },
  GRAFANA_TOKEN: {
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
