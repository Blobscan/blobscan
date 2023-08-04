import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "blobscan_rest_api",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter(),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// gracefully shut down the SDK on process exit
function gracefulShutdown() {
  sdk
    .shutdown()
    .then(
      () => console.log("SDK shut down successfully"),
      (err) => console.log("Error shutting down SDK", err)
    )
    .finally(() => process.exit(0));
}

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
