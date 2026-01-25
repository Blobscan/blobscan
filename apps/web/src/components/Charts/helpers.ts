import type { TimeseriesData, Chartable, TimeseriesName } from "~/types";
import { normalizeNumerish } from "../../utils";

type AggregationType = "count" | "average" | "time";

export function aggregateValues(
  values: number[] | string[],
  type: AggregationType
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

export function aggregateSeries(
  series: { name?: string; values: number[] }[],
  type: AggregationType
): number[];
export function aggregateSeries(
  series: { name?: string; values: string[] }[],
  type: AggregationType
): string[];
export function aggregateSeries<T extends number | string | bigint>(
  series: {
    name?: string;
    values: T[];
  }[],
  type: AggregationType
): T[] {
  return series.reduce((acc, { values }) => {
    return values.map((v, i) => {
      const value = normalizeNumerish(v);
      const zero = typeof value === "bigint" ? BigInt(0) : 0;
      const accValue = acc[i] ? normalizeNumerish(acc[i]) : zero;

      if (accValue === zero) {
        return v as T;
      }

      if (type === "average") {
        if (typeof value === "bigint") {
          return (
            ((accValue as bigint) + (value as bigint)) /
            BigInt(2)
          ).toString() as T;
        }

        return (((accValue as number) + (value as number)) / 2) as T;
      }

      if (typeof value === "bigint") {
        return ((accValue as bigint) + (value as bigint)).toString() as T;
      }

      return ((accValue as number) + (value as number)) as T;
    });
  }, [] as T[]);
}

type MetricDefinitions<T extends TimeseriesData> =
  T["series"][number]["metrics"];
type MetricDefinitionOf<
  T extends TimeseriesData,
  K extends keyof MetricDefinitions<T>
> = MetricDefinitions<T>[K];

type TimeseriesChartData<T extends TimeseriesData> = {
  timestamps: string[];
  metricSeries: {
    [K in keyof MetricDefinitions<T>]?: Array<{
      name: TimeseriesName;
      values: NonNullable<Chartable<MetricDefinitions<T>[K]>>;
    }>;
  };
};

function getDefaultValue<T extends number | string>(sample: T) {
  return typeof sample === "string" ? "0" : 0;
}

function normalizeSeriesLength<T extends number | string>(
  values: T[],
  startTimestampIdx: number,
  totalTimestamps: number
): T[] {
  const sample = values.find((v) => v !== null && v !== undefined);

  if (!sample) return values;

  const defaultValue = getDefaultValue(sample) as T;
  const left = startTimestampIdx;
  const right = Math.max(
    0,
    totalTimestamps - (startTimestampIdx + values.length)
  );

  if (left === 0 && right === 0) return values;

  return [
    ...Array.from({ length: left }, () => defaultValue),
    ...values,
    ...Array.from({ length: right }, () => defaultValue),
  ];
}

export function convertTimeseriesToChartData<T extends TimeseriesData>(
  timeseries: T
): TimeseriesChartData<T> {
  const { timestamps, series } = timeseries;
  const totalTimestamps = timestamps.length;

  const chartData: TimeseriesChartData<T> = {
    timestamps: timestamps.map((t) => t.toString()),
    metricSeries: {},
  };

  for (const { dimension, metrics, startTimestampIdx = 0 } of series) {
    for (const [metricName, metricValues] of Object.entries(metrics)) {
      const metricName_ =
        metricName as keyof TimeseriesChartData<T>["metricSeries"];

      if (!metricValues.length) continue;

      const normalizedMetricValues = metricValues.map((v) =>
        typeof v !== "number" ? v.toString() : v
      );

      const alignedValues = normalizeSeriesLength(
        normalizedMetricValues,
        startTimestampIdx,
        totalTimestamps
      );

      (chartData.metricSeries[metricName_] ??= []).push({
        name: dimension.name ?? "global",
        values: alignedValues as NonNullable<
          Chartable<MetricDefinitionOf<T, typeof metricName_>>
        >,
      });
    }
  }

  return chartData;
}
