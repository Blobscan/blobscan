import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import { Gauge } from "prom-client";

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

// Prometheus metrics for latest block and slot
// Use a function that safely registers metrics to prevent duplicate registration errors in tests
const registerGauge = (name: string, help: string): Gauge<string> => {
  try {
    const existingMetric = promRegister.getSingleMetric(name);
    if (existingMetric) {
      return existingMetric as Gauge<string>;
    }
    return new Gauge({
      name,
      help,
      registers: [promRegister],
    });
  } catch (error) {
    // If there's an error, log it and return a no-op gauge
    console.error(`Error registering gauge ${name}:`, error);
    return new Gauge({
      name,
      help,
      registers: [],
    });
  }
};

export const latestBlockNumberGauge = registerGauge(
  "blobscan_latest_block_number",
  "Latest block number indexed by Blobscan"
);

export const latestSlotGauge = registerGauge(
  "blobscan_latest_slot",
  "Latest slot indexed by Blobscan"
);

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

    // Update the latest block and slot metrics
    try {
      const latestBlock = await prisma.block.findLatest();
      if (latestBlock) {
        latestBlockNumberGauge.set(latestBlock.number);
        latestSlotGauge.set(latestBlock.slot);
      }
    } catch (error) {
      console.error("Failed to update latest block metrics:", error);
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
