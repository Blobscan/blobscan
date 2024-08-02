import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import * as Sentry from "@sentry/node";

import { env } from "@blobscan/env";
import { setUpOpenTelemetry } from "@blobscan/open-telemetry";

Sentry.init({
  dsn: env.SENTRY_DSN_API,
  tracesSampleRate: 1.0,
});

if (env.TRACES_ENABLED) {
  setUpOpenTelemetry("blobscan_rest_api", {
    instrumentations: [new ExpressInstrumentation()],
  });
}
