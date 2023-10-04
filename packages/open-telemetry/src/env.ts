import { logger } from "@blobscan/logger";
import { createEnv, nodeEnvSchema, presetEnvOptions, z } from "@blobscan/zod";

export const env = createEnv({
  server: {
    OTEL_EXPORTER_OTLP_PROTOCOL: z
      .enum(["grpc", "http/protobuf", "http/json"])
      .default("http/protobuf"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z
      .string()
      .url()
      .default("http://localhost:4318"),
    OTLP_AUTH_USERNAME: z.coerce.string().optional(),
    OTLP_AUTH_PASSWORD: z.string().optional(),
    NODE_ENV: nodeEnvSchema.optional(),
  },

  ...presetEnvOptions,
});

logger.info(
  `Otel configuration: protocol=${env.OTEL_EXPORTER_OTLP_PROTOCOL} exporterEndpoint=${env.OTEL_EXPORTER_OTLP_ENDPOINT} username=${env.OTLP_AUTH_USERNAME} password=${env.OTLP_AUTH_PASSWORD}`
);
