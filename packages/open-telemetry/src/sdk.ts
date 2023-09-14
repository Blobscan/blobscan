import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import type { NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { NodeSDK, resources, api } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

import { env } from "./env";

api.diag.setLogger(new api.DiagConsoleLogger(), api.DiagLogLevel.INFO);

const exporterOptions: { headers?: Record<string, string> } = {};

/**
 * The environment variable 'OTEL_EXPORTER_OTLP_HEADERS' is not set directly. The OTLP Exporter does not
 * correctly parse authentication keys containing characters such as `=` which it interprets as parse separators.
 * Therefore, to avoid parsing errors, we build the auth header ourselves.
 */
if (env.OTLP_AUTH_USERNAME && env.OTLP_AUTH_PASSWORD) {
  exporterOptions.headers = {
    Authorization: `Basic ${btoa(
      `${env.OTLP_AUTH_USERNAME}:${env.OTLP_AUTH_PASSWORD}`
    )}`,
  };
}

export function setUpOpenTelemetry(
  serviceName: string,
  config?: Partial<NodeSDKConfiguration>
) {
  const sdk = new NodeSDK({
    ...config,
    resource: new resources.Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.NODE_ENV,
      ...(config?.resource?.attributes ?? {}),
    }),
    traceExporter:
      config?.traceExporter ?? new OTLPTraceExporter(exporterOptions),

    instrumentations: [
      new HttpInstrumentation(),
      new PrismaInstrumentation(),
      new WinstonInstrumentation(),
      ...(config?.instrumentations ?? []),
    ],
  });

  sdk.start();

  console.log("OpenTelemetry SDK started successfully");

  // gracefully shut down the SDK on process exit
  const gracefulShutdown = function () {
    sdk
      .shutdown()
      .then(
        () => console.log("SDK shut down successfully"),
        (err) => console.log("Error shutting down SDK", err)
      )
      .finally(() => process.exit(0));
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}
