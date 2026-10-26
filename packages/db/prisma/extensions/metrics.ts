import { Counter, Histogram } from "prom-client";

import { promRegister } from "@blobscan/open-telemetry";

import { Prisma } from "../client/client";

const QUERY_COUNTER_NAME = "prisma_client_queries_total";
const QUERY_DURATION_NAME = "prisma_client_queries_duration_histogram_ms";

const queryCounter =
  (promRegister.getSingleMetric(QUERY_COUNTER_NAME) as
    | Counter<"model" | "action">
    | undefined) ??
  new Counter({
    name: QUERY_COUNTER_NAME,
    help: "Total number of Prisma Client queries executed",
    labelNames: ["model", "action"] as const,
    registers: [promRegister],
  });

const queryDurationHistogram =
  (promRegister.getSingleMetric(QUERY_DURATION_NAME) as
    | Histogram<"model" | "action">
    | undefined) ??
  new Histogram({
    name: QUERY_DURATION_NAME,
    help: "Histogram of the duration of all executed Prisma Client queries in ms",
    labelNames: ["model", "action"] as const,
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [promRegister],
  });

/**
 * Prisma ORM 7 removed the metrics preview feature. This extension restores
 * query count and duration metrics in the Prometheus registry so the /metrics
 * endpoint keeps exposing the most useful Prisma client metrics.
 */
export const metricsExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Prisma Metrics",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const labels = { model, action: operation };
          const endTimer = queryDurationHistogram.startTimer(labels);

          queryCounter.inc(labels);

          try {
            return await query(args);
          } finally {
            endTimer();
          }
        },
      },
    },
  })
);
