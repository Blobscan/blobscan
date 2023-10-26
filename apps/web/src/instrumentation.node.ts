import {
  setUpOpenTelemetry,
  collectDefaultMetrics,
} from "@blobscan/open-telemetry";

import { env } from "./env.mjs";

if (env.METRICS_ENABLED) {
  collectDefaultMetrics();
}

if (env.TRACES_ENABLED) {
  setUpOpenTelemetry("blobscan_web");
}
