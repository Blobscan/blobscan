import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";

import { env } from "@blobscan/env";
import { setUpOpenTelemetry } from "@blobscan/open-telemetry";

if (env.TRACES_ENABLED) {
  setUpOpenTelemetry("blobscan_rest_api", {
    instrumentations: [new ExpressInstrumentation()],
  });
}
