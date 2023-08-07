import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

import { setUpOpenTelemetry } from "@blobscan/open-telemetry";

setUpOpenTelemetry(
  {
    instrumentations: [
      new ExpressInstrumentation(),
      new WinstonInstrumentation(),
    ],
  },
  {
    [SemanticResourceAttributes.SERVICE_NAME]: "blobscan_rest_api",
  }
);
