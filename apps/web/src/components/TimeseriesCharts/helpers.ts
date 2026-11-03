import type {
  TimeseriesData,
  TimeseriesMetric,
  Chartable,
  NullableElements,
  Category,
  Rollup,
  Prettify,
  TimeseriesGranularity,
} from "~/types";
import type { Numerish } from "~/utils";
import type { Axis } from "../Charts/ChartBase";

/**
 * Aggregates the values of the series at one timestamp. A missing value
 * counts as zero. For example, a rollup has no value before its first day.
 */
export function aggregateValues(
  values: (Numerish | null | undefined)[],
  type: Axis["type"]
): number {
  if (!values.length) {
    return 0;
  }

  const normalizedValues = values.map((v) => Number(v ?? 0));

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

export type TimeseriesDataset<T extends TimeseriesData = TimeseriesData> =
  Prettify<{
    id: DatasetId;
    /**
     * The length of each period. Each timestamp is the start of a period.
     */
    granularity?: TimeseriesGranularity;
    /**
     * The current period when the data includes it. The current period is not
     * complete, so its values are partial.
     */
    currentPeriod?: T["currentPeriod"];
    source: {
      timestamp: Date[];
    } & {
      [K in keyof MetricDefinitions<T>]: NullableElements<
        Chartable<MetricDefinitions<T>[K]>
      >;
    };
  }>;

function padSeries<S extends (string | number | null)[]>(
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
  granularity,
  currentPeriod,
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
            ? metricValues.map((v) => v?.toString() ?? null)
            : metricValues
        ) as (string | number | null)[];

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
      granularity,
      currentPeriod,
      source: {
        timestamp: timestamps,
        ...paddedMetrics,
      },
    };
  });

  return datesets;
}

/**
 * Metrics that the API does not return. A chart calculates each one from two
 * metrics of its dataset: the numerator divided by the denominator.
 */
export const DERIVED_METRICS = {
  // The database has no USD averages. The divisor is the count of the
  // transactions that have a USD fee, not totalTransactions: a transaction
  // with no ETH/USD price is not in totalBlobBaseFeeUsd.
  avgBlobBaseFeeUsd: {
    numerator: "totalBlobBaseFeeUsd",
    denominator: "totalUsdPricedTransactions",
  },
} as const satisfies Record<
  string,
  { numerator: TimeseriesMetric; denominator: TimeseriesMetric }
>;

export type DerivedMetric = keyof typeof DERIVED_METRICS;

export type ChartMetric = TimeseriesMetric | DerivedMetric;

export function isDerivedMetric(metric: ChartMetric): metric is DerivedMetric {
  return metric in DERIVED_METRICS;
}

/**
 * Adds a column to the dataset for each derived metric. A value is null when
 * the numerator is null or the denominator is null or zero.
 */
export function addDerivedColumns(
  dataset: TimeseriesDataset,
  metrics: DerivedMetric[]
) {
  const source = dataset.source as Record<string, unknown[] | undefined>;
  const columns = Object.fromEntries(
    metrics.map((metric) => {
      const { numerator, denominator } = DERIVED_METRICS[metric];
      const denominatorValues = source[denominator] ?? [];
      const values = (source[numerator] ?? []).map((value, i) => {
        const divisor = denominatorValues[i];

        return value === null ||
          value === undefined ||
          divisor === null ||
          divisor === undefined ||
          Number(divisor) === 0
          ? null
          : Number(value) / Number(divisor);
      });

      return [metric, values];
    })
  );

  return {
    ...dataset,
    source: { ...dataset.source, ...columns },
  } as TimeseriesDataset;
}
