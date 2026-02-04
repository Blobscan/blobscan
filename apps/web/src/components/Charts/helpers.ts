import type { FC } from "react";
import React from "react";

import type {
  TimeseriesData,
  Chartable,
  NullableElements,
  Category,
  Rollup,
  TimeseriesMetric,
} from "~/types";
import type { MetricInfo } from "./ChartBase";
import type {
  TimeseriesChartComponent,
  TimeseriesChartProps,
} from "./ChartBase/types";

export function aggregateValues(
  values: number[] | string[],
  type: MetricInfo["type"]
): number {
  if (!values.length) {
    return 0;
  }

  const normalizedValues = values.map((v) => Number(v));

  switch (type) {
    case "count": {
      return normalizedValues.reduce((acc, value) => acc + value, 0);
    }
    case "average": {
      const total = normalizedValues.reduce((acc, value) => acc + value, 0);
      return total / values.length;
    }
    default:
      throw new Error(`Aggregation type "${type}" not supported`);
  }
}

type MetricDefinitions<T extends TimeseriesData> =
  T["series"][number]["metrics"];

type MetricDefinitionOf<
  T extends TimeseriesData,
  K extends keyof MetricDefinitions<T>
> = MetricDefinitions<T>[K];

export type DatasetId = "global" | `category-${Category}` | `rollup-${Rollup}`;

export type TimeseriesDataset<T extends TimeseriesData = TimeseriesData> = {
  id: DatasetId;
  source: {
    timestamp: Date[];
  } & {
    [K in keyof MetricDefinitions<T>]: NullableElements<
      Chartable<MetricDefinitions<T>[K]>
    >;
  };
};

function padSeries<S extends (string | number)[]>(
  series: S,
  offset: number,
  totalLength: number
): Array<S[number] | null> {
  const left = Math.max(0, offset);
  const right = Math.max(0, totalLength - (offset + series.length));

  return [
    ...Array.from({ length: left }, () => null),
    ...series,
    ...Array.from({ length: right }, () => null),
  ];
}

export function transformToDatasets<T extends TimeseriesData>({
  series,
  timestamps,
}: T): TimeseriesDataset<T>[] {
  const allEmptySeries = series.every((s) => s.startTimestampIdx === undefined);

  if (allEmptySeries) {
    return [];
  }

  const datesets = series.map(({ dimension, metrics, startTimestampIdx }) => {
    const paddedMetrics = Object.entries(metrics).reduce(
      (acc, [metricName, metricValues]) => {
        const metricName_ = metricName as keyof MetricDefinitions<T>;
        const offset = startTimestampIdx ?? 0;
        const totalLength = timestamps.length;

        const sample = metricValues.find((v) => v !== null && v !== undefined);

        const metricValues_ = (
          typeof sample === "bigint"
            ? metricValues.map((v) => v.toString())
            : metricValues
        ) as string[] | number[];

        acc[metricName_] = padSeries(
          metricValues_,
          offset,
          totalLength
        ) as NullableElements<
          Chartable<MetricDefinitionOf<T, typeof metricName_>>
        >;

        return acc;
      },
      {} as {
        [K in keyof MetricDefinitions<T>]: NullableElements<
          Chartable<MetricDefinitions<T>[K]>
        >;
      }
    );

    return {
      id: (dimension.type === "global"
        ? "global"
        : `${dimension.type}-${dimension.name}`) as DatasetId,
      source: {
        timestamp: timestamps,
        ...paddedMetrics,
      },
    };
  });

  return datesets;
}

export function defineTimeseriesChart<P extends TimeseriesChartProps>(
  Comp: FC<P>,
  requiredMetrics: [TimeseriesMetric, ...TimeseriesMetric[]],
  displayName?: string
): TimeseriesChartComponent<P> {
  return Object.assign(React.memo(Comp), {
    requiredMetrics,
    displayName: displayName ?? Comp.displayName,
  });
}
