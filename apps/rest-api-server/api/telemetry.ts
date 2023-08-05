import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { Resource } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

import { env } from "./env";

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const exporterOptions: { headers?: Record<string, string> } = {};

/**
 * The environment variable 'OTEL_EXPORTER_OTLP_HEADERS' is not set directly. The OTLP Exporter does not
 * correctly parse authentication keys containing characters such as `=` which it interprets as parse separators.
 * Therefore, to avoid parsing errors, we build the auth header ourselves.
 */
if (env.GRAFANA_INSTANCE_ID && env.GRAFANA_TOKEN) {
  exporterOptions.headers = {
    Authorization: `Basic ${btoa(
      `${env.GRAFANA_INSTANCE_ID}:${env.GRAFANA_TOKEN}`
    )}`,
  };
}

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "blobscan_rest_api",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
  }),
  traceExporter: new OTLPTraceExporter(exporterOptions),
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
