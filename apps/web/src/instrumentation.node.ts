import {
  setUpOpenTelemetry,
  collectDefaultMetrics,
} from "@blobscan/open-telemetry";

import { env } from "./env.mjs";

if (env.METRICS_ENABLED) {
  collectDefaultMetrics();
}

if (env.TRACES_ENABLED) {
  setUpOpenTelemetry("blobscan_web", {
    enableDiagnosticLogs: env.OTEL_DIAG_ENABLED,
    exporter:
      env.OTLP_AUTH_USERNAME && env.OTLP_AUTH_PASSWORD
        ? {
            otlpAuth: {
              username: env.OTLP_AUTH_USERNAME,
              password: env.OTLP_AUTH_PASSWORD,
            },
          }
        : undefined,
  });
}
