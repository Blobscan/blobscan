import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";

import { prisma } from "@blobscan/db";
import type { MetricsClient } from "@blobscan/db";
import { env } from "@blobscan/env";
import { api, promRegister } from "@blobscan/open-telemetry";

const scopeName = "blobscan_api";

function hasMetricsClient(
  p: typeof prisma
): p is typeof prisma & { $metrics: MetricsClient } {
  return p !== null && "$metrics" in p;
}

export const tracer = api.trace.getTracer(scopeName);
export const meter = api.metrics.getMeter(scopeName);

export async function metricsHandler(
  _: NodeHTTPRequest,
  res: NodeHTTPResponse
) {
  {
    if (!env.METRICS_ENABLED) {
      res.statusCode = 404;
      res.end("Metrics are disabled");

      return;
    }

    const prismaMetricsClient = hasMetricsClient(prisma)
      ? prisma.$metrics
      : undefined;

    const [appMetrics, prismaMetrics] = await Promise.all([
      promRegister.metrics(),
      Promise.resolve(prismaMetricsClient?.prometheus() ?? ""),
    ]);

    res.setHeader("Content-Type", promRegister.contentType);

    res.end(appMetrics + prismaMetrics);
  }
}
