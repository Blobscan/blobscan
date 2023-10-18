import { metricsHandler } from "@blobscan/api";
import { collectDefaultMetrics } from "@blobscan/open-telemetry";

collectDefaultMetrics();

export default metricsHandler;
