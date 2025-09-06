import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";
import type { NodeSDKConfiguration } from "@opentelemetry/sdk-node";
import { NodeSDK, resources, api } from "@opentelemetry/sdk-node";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { PrismaInstrumentation } from "@prisma/instrumentation";

import { logger } from "@blobscan/logger";

export type Config = {
  sdk?: Partial<NodeSDKConfiguration>;
  exporter?: { otlpAuth?: { username: string; password: string } };
  enableDiagnosticLogs?: boolean;
};

function buildExporterAuthHeader(username: string, password: string) {
  return {
    headers: {
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    },
  };
}

export function setUpOpenTelemetry(serviceName: string, config?: Config) {
  if (config?.enableDiagnosticLogs) {
    api.diag.setLogger(new api.DiagConsoleLogger(), api.DiagLogLevel.INFO);
  }
  const otlpAuth = config?.exporter?.otlpAuth;
  /**
   * The environment variable 'OTEL_EXPORTER_OTLP_HEADERS' is not set directly. The OTLP Exporter does not
   * correctly parse authentication keys containing characters such as `=` which it interprets as parse separators.
   * Therefore, to avoid parsing errors, we build the auth header ourselves.
   */
  const exporterOptions = otlpAuth
    ? buildExporterAuthHeader(otlpAuth.username, otlpAuth.password)
    : undefined;

  const sdk = new NodeSDK({
    ...config,
    resource: new resources.Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
      ...(config?.sdk?.resource?.attributes ?? {}),
    }),
    traceExporter:
      config?.sdk?.traceExporter ?? new OTLPTraceExporter(exporterOptions),

    instrumentations: [
      new HttpInstrumentation(),
      new PrismaInstrumentation(),
      new WinstonInstrumentation(),
      ...(config?.sdk?.instrumentations ?? []),
    ],
  });

  sdk.start();

  logger.info("OpenTelemetry SDK started successfully");

  // gracefully shut down the SDK on process exit
  const gracefulShutdown = function () {
    sdk
      .shutdown()
      .then(
        () => logger.info("SDK shut down successfully"),
        (err) => logger.error(`Error shutting down SDK: ${err}`)
      )
      .finally(() => process.exit(0));
  };

  process.on("SIGINT", gracefulShutdown);
  process.on("SIGTERM", gracefulShutdown);
}
