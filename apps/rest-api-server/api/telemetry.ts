import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { Resource } from "@opentelemetry/resources";
// import {
//   PeriodicExportingMetricReader,
//   ConsoleMetricExporter,
// } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
// import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { ExpressInstrumentation } from "opentelemetry-instrumentation-express";

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "blobscan-rest-api",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  // traceExporter: new ConsoleSpanExporter(),
  // metricReader: new PeriodicExportingMetricReader({
  //   exporter: new ConsoleMetricExporter(),
  // }),
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
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
