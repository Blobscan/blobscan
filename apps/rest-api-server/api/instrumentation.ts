import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";

import { setUpOpenTelemetry } from "@blobscan/open-telemetry";

setUpOpenTelemetry("blobscan_rest_api", {
  instrumentations: [
    new ExpressInstrumentation(),
    new WinstonInstrumentation(),
  ],
});
