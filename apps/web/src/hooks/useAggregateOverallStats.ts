import { useMemo } from "react";

import type { OverallStats, Rollup } from "~/types";
import { performDiv } from "~/utils";

type Metrics = OverallStats["metrics"];

export type AggregatedMetrics = {
  [K in keyof Metrics]?: NonNullable<Metrics[K]>;
};

type NumberMetricName = {
  [K in keyof AggregatedMetrics]: AggregatedMetrics[K] extends
    | number
    | undefined
    ? K
    : never;
}[keyof AggregatedMetrics];

type BigIntMetricName = {
  [K in keyof AggregatedMetrics]: AggregatedMetrics[K] extends
    | bigint
    | undefined
    ? K
    : never;
}[keyof AggregatedMetrics];

const NUMBER_TOTALS = [
  "totalBlobs",
  "totalBlocks",
  "totalTransactions",
  "totalUniqueBlobs",
  "totalUniqueReceivers",
  "totalUniqueSenders",
] as const satisfies readonly NumberMetricName[];

const BIGINT_TOTALS = [
  "totalBlobAsCalldataFee",
  "totalBlobAsCalldataGasUsed",
  "totalBlobAsCalldataMaxFee",
  "totalBlobBaseFee",
  "totalBlobGasPrice",
  "totalBlobGasUsed",
  "totalBlobMaxFee",
  "totalBlobSize",
  "totalBlobUsageSize",
  "totalMaxBlobGasFee",
] as const satisfies readonly BigIntMetricName[];

export function toAggregatedMetrics(metrics: Metrics): AggregatedMetrics {
  return Object.fromEntries(
    Object.entries(metrics).map(([name, value]) => [name, value ?? undefined])
  ) as AggregatedMetrics;
}

// Returns undefined when no row has a value (e.g. global-only metrics on
// rollup rows)
function sumNumbers(values: (number | null | undefined)[]) {
  const present = values.filter((v): v is number => v != null);

  return present.length ? present.reduce((acc, v) => acc + v, 0) : undefined;
}

function sumBigInts(values: (bigint | null | undefined)[]) {
  const present = values.filter((v): v is bigint => v != null);

  return present.length
    ? present.reduce((acc, v) => acc + v, BigInt(0))
    : undefined;
}

function avg(total: bigint | undefined, count: number | undefined) {
  if (total === undefined || !count) {
    return undefined;
  }

  return performDiv(total, BigInt(count));
}

export function useAggregateOverallStats(
  selectedRollups: Rollup[],
  overallStats?: OverallStats[]
): AggregatedMetrics | undefined {
  return useMemo(() => {
    if (!overallStats) {
      return;
    }

    if (!selectedRollups.length) {
      const globalMetrics = overallStats.find(
        (s) => s.dimension.type === "global"
      )?.metrics;

      return globalMetrics ? toAggregatedMetrics(globalMetrics) : undefined;
    }

    const selectedMetrics = overallStats
      .filter(({ dimension }) =>
        dimension.type === "rollup" && dimension.name
          ? selectedRollups.includes(dimension.name as Rollup)
          : false
      )
      .map(({ metrics }) => metrics);

    const aggregations = {} as AggregatedMetrics;

    for (const name of NUMBER_TOTALS) {
      aggregations[name] = sumNumbers(selectedMetrics.map((m) => m[name]));
    }

    for (const name of BIGINT_TOTALS) {
      aggregations[name] = sumBigInts(selectedMetrics.map((m) => m[name]));
    }

    // Same denominators as the generated average columns in the database
    const { totalTransactions, totalBlocks, totalBlobs } = aggregations;

    aggregations.avgBlobBaseFee = avg(
      aggregations.totalBlobBaseFee,
      totalTransactions
    );
    aggregations.avgBlobMaxFee = avg(
      aggregations.totalBlobMaxFee,
      totalTransactions
    );
    aggregations.avgBlobAsCalldataFee = avg(
      aggregations.totalBlobAsCalldataFee,
      totalTransactions
    );
    aggregations.avgBlobAsCalldataMaxFee = avg(
      aggregations.totalBlobAsCalldataMaxFee,
      totalTransactions
    );
    aggregations.avgMaxBlobGasFee = avg(
      aggregations.totalMaxBlobGasFee,
      totalTransactions
    );
    aggregations.avgBlobGasPrice = avg(
      aggregations.totalBlobGasPrice,
      totalBlocks
    );
    aggregations.avgBlobUsageSize = avg(
      aggregations.totalBlobUsageSize,
      totalBlobs
    );

    return aggregations;
  }, [overallStats, selectedRollups]);
}
