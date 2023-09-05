import { createEnv, presetEnvOptions, z } from "@blobscan/zod";

export const env = createEnv({
  server: {
    OTEL_EXPORTER_OTLP_PROTOCOL: z
      .enum(["grpc", "http/protobuf", "http/json"])
      .optional(),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
    OTLP_AUTH_USERNAME: z.coerce.string().optional(),
    OTLP_AUTH_PASSWORD: z.string().optional(),
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  },

  ...presetEnvOptions,
});
