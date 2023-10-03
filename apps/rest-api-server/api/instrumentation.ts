import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";

import { setUpOpenTelemetry } from "@blobscan/open-telemetry";

import { env } from "./env";

if (env.TRACES_ENABLED) {
  setUpOpenTelemetry("blobscan_rest_api", {
    instrumentations: [new ExpressInstrumentation()],
  });
}
