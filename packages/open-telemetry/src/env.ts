import {
  createEnv,
  makeOptional,
  nodeEnvSchema,
  presetEnvOptions,
  z,
} from "@blobscan/zod";

export const env = createEnv({
  server: {
    OTEL_EXPORTER_OTLP_PROTOCOL: makeOptional(
      z.enum(["grpc", "http/protobuf", "http/json"])
    ),
    OTEL_EXPORTER_OTLP_ENDPOINT: makeOptional(z.string().url()),
    OTLP_AUTH_USERNAME: makeOptional(z.coerce.string()),
    OTLP_AUTH_PASSWORD: makeOptional(z.string()),
    NODE_ENV: makeOptional(nodeEnvSchema),
  },

  ...presetEnvOptions,
});
