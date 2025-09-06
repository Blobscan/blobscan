import type {
  NodeHTTPRequest,
  NodeHTTPResponse,
} from "@trpc/server/adapters/node-http";
import { Gauge } from "prom-client";

import type { BlobscanPrismaClient, MetricsClient } from "@blobscan/db";
import { api, promRegister } from "@blobscan/open-telemetry";

const scopeName = "blobscan_api";

function hasMetricsClient(
  p: BlobscanPrismaClient
): p is BlobscanPrismaClient & { $metrics: MetricsClient } {
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

export const lastBlockIndexTimestampGauge = registerGauge(
  "blobscan_last_block_index_timestamp",
  "Timestamp of the last block indexed by Blobscan"
);

export function createMetricsHandler(prisma: BlobscanPrismaClient) {
  return async (_: NodeHTTPRequest, res: NodeHTTPResponse) => {
    try {
      const latestBlock = await prisma.block.findLatest();
      if (latestBlock) {
        latestBlockNumberGauge.set(latestBlock.number);
        latestSlotGauge.set(latestBlock.slot);
        lastBlockIndexTimestampGauge.set(
          Math.floor(latestBlock.insertedAt.getTime() / 1000)
        );
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
  };
}
