import type { Pool } from "pg";
import { Counter, Gauge, Histogram } from "prom-client";

import { promRegister } from "@blobscan/open-telemetry";

import { Prisma } from "../client/client";

const QUERY_COUNTER_NAME = "prisma_client_queries_total";
const QUERY_DURATION_NAME = "prisma_client_queries_duration_histogram_ms";
const POOL_CONNECTIONS_OPEN_NAME = "prisma_pool_connections_open";
const QUERIES_WAIT_NAME = "prisma_client_queries_wait";

// The series are deliberately label-free so they keep the shape Prisma's
// removed `$metrics` exposed (one series per instance).
const queryCounter =
  (promRegister.getSingleMetric(QUERY_COUNTER_NAME) as Counter | undefined) ??
  new Counter({
    name: QUERY_COUNTER_NAME,
    help: "Total number of Prisma Client queries executed",
    registers: [promRegister],
  });

const queryDurationHistogram =
  (promRegister.getSingleMetric(QUERY_DURATION_NAME) as
    | Histogram
    | undefined) ??
  new Histogram({
    name: QUERY_DURATION_NAME,
    help: "Histogram of the duration of all executed Prisma Client queries in ms",
    buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    registers: [promRegister],
  });

let observedPool: Pool | undefined;

function registerPoolGauge(
  name: string,
  help: string,
  read: (p: Pool) => number
) {
  if (promRegister.getSingleMetric(name)) {
    return;
  }

  new Gauge({
    name,
    help,
    registers: [promRegister],
    collect() {
      this.set(observedPool ? read(observedPool) : 0);
    },
  });
}

registerPoolGauge(
  POOL_CONNECTIONS_OPEN_NAME,
  "Number of connections currently open in the database pool",
  (pool) => pool.totalCount
);
registerPoolGauge(
  QUERIES_WAIT_NAME,
  "Number of queries waiting for a free connection in the database pool",
  (pool) => pool.waitingCount
);

/**
 * Points the pool gauges at the pg pool used by the Prisma driver adapter.
 */
export function observePool(pool: Pool) {
  observedPool = pool;
}

/**
 * Prisma ORM 7 removed the metrics preview feature. This extension restores
 * query count and duration metrics in the Prometheus registry. It hooks
 * `$allOperations` at the client level so raw queries (`$queryRaw`,
 * `$executeRaw`, `upsertMany`) are measured too.
 */
export const metricsExtension = Prisma.defineExtension((prisma) =>
  prisma.$extends({
    name: "Prisma Metrics",
    query: {
      async $allOperations({ args, query }) {
        const start = performance.now();

        queryCounter.inc();

        try {
          return await query(args);
        } finally {
          queryDurationHistogram.observe(performance.now() - start);
        }
      },
    },
  })
);
