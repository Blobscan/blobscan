import type { EChartOption } from "echarts";

// The current period is not complete. Separate series draw its point: a
// dotted segment and a hollow point for a line, a dashed and lighter bar for a
// bar. These series read the extra columns that addCurrentPeriodColumns adds
// to the dataset.
const CLOSED_COLUMN_SUFFIX = "__closed";
// A stacked bar of the current period is drawn on top of the bars of the
// other series at the same index. A null value there moves it up, so the
// closed column of bars has a zero for the current period.
const CLOSED_BAR_COLUMN_SUFFIX = "__closed-bar";
const CURRENT_COLUMN_SUFFIX = "__current";
const TAIL_COLUMN_SUFFIX = "__tail";

export const CURRENT_PERIOD_SERIES_ID_SUFFIX = "__current-period";

export type ChartSeries = {
  id?: string;
  name?: string;
  type?: string;
  stack?: string;
  smooth?: boolean | number;
  datasetIndex?: number;
  encode?: { x?: string; y?: string };
  itemStyle?: { color?: unknown; [style: string]: unknown };
  areaStyle?: Record<string, unknown>;
  [option: string]: unknown;
};

/**
 * A dataset that can include the current period. `currentPeriodTimestamp` is
 * the start of the current period when the dataset includes it.
 */
export type ChartDataset = EChartOption.Dataset & {
  currentPeriodTimestamp?: Date;
};

export type PeriodUnit = "hour" | "day";

const PERIOD_UNIT_LABELS: Record<PeriodUnit, string> = {
  hour: "This hour",
  day: "Today",
};

export function getCurrentPeriodLabel(unit: PeriodUnit) {
  return `${PERIOD_UNIT_LABELS[unit]} so far · in progress (UTC)`;
}

export function isCurrentPeriodSeries(seriesId: unknown) {
  return (
    typeof seriesId === "string" &&
    seriesId.endsWith(CURRENT_PERIOD_SERIES_ID_SUFFIX)
  );
}

/**
 * Returns the index of the series that a hover on a series belongs to. A
 * current period series belongs to the series with the same name, so the
 * tooltip marks the row of that series.
 */
export function getMainSeriesIndex(
  chartSeries: ChartSeries[],
  seriesIndex: number | undefined
) {
  const series =
    seriesIndex === undefined ? undefined : chartSeries[seriesIndex];

  if (!series || !isCurrentPeriodSeries(series.id)) {
    return seriesIndex;
  }

  const mainSeriesIndex = chartSeries.findIndex(
    (s) => s.name === series.name && !isCurrentPeriodSeries(s.id)
  );

  return mainSeriesIndex === -1 ? seriesIndex : mainSeriesIndex;
}

/**
 * Returns the metric column of a column that addCurrentPeriodColumns added.
 */
export function getMetricColumn(column: string) {
  for (const suffix of [
    CLOSED_COLUMN_SUFFIX,
    CLOSED_BAR_COLUMN_SUFFIX,
    CURRENT_COLUMN_SUFFIX,
    TAIL_COLUMN_SUFFIX,
  ]) {
    if (column.endsWith(suffix)) {
      return column.slice(0, -suffix.length);
    }
  }

  return column;
}

type ColumnSource = Record<string, unknown[]> & { timestamp: unknown[] };

function isColumnSource(source: unknown): source is ColumnSource {
  return (
    typeof source === "object" &&
    source !== null &&
    !Array.isArray(source) &&
    Array.isArray((source as Record<string, unknown>).timestamp)
  );
}

function toTime(value: unknown) {
  return value instanceof Date || typeof value === "string"
    ? new Date(value).getTime()
    : Number(value);
}

function findCurrentPeriodIdx(
  { source }: EChartOption.Dataset,
  currentPeriodTimestamp: Date
) {
  if (!isColumnSource(source)) {
    return -1;
  }

  return source.timestamp.findIndex(
    (t) => toTime(t) === currentPeriodTimestamp.getTime()
  );
}

/**
 * Returns the start of the current period when a dataset includes it.
 */
export function getCurrentPeriodTimestamp(
  datasets: ChartDataset[]
): Date | undefined {
  return datasets
    .map((d) => d.currentPeriodTimestamp)
    .find(
      (timestamp) =>
        timestamp &&
        datasets.some((d) => findCurrentPeriodIdx(d, timestamp) !== -1)
    );
}

/**
 * Adds these columns for each metric column of the dataset that the chart
 * draws (`metricColumns`, or all the metric columns when it is not given):
 * - closed: the metric values with no value for the current period.
 * - closed bar: the metric values with a zero for the current period.
 * - current: only the value of the current period.
 * - tail: only the values of the last closed period and the current period.
 *
 * A dataset can have many metric columns that the chart does not draw, so
 * give `metricColumns` to add fewer columns.
 */
export function addCurrentPeriodColumns(
  { currentPeriodTimestamp: _, ...dataset }: ChartDataset,
  currentPeriodTimestamp: Date,
  metricColumns?: string[]
): EChartOption.Dataset {
  const { source } = dataset;
  const currentIdx = findCurrentPeriodIdx(dataset, currentPeriodTimestamp);

  if (!isColumnSource(source) || currentIdx === -1) {
    return dataset;
  }

  const newSource: Record<string, unknown[]> = { ...source };
  const columns =
    metricColumns ?? Object.keys(source).filter((c) => c !== "timestamp");

  for (const column of columns) {
    const values = source[column];

    if (!values) {
      continue;
    }

    newSource[`${column}${CLOSED_COLUMN_SUFFIX}`] = values.map((v, i) =>
      i === currentIdx ? null : v
    );
    newSource[`${column}${CLOSED_BAR_COLUMN_SUFFIX}`] = values.map((v, i) =>
      i === currentIdx ? 0 : v
    );
    newSource[`${column}${CURRENT_COLUMN_SUFFIX}`] = values.map((v, i) =>
      i === currentIdx ? v : null
    );
    newSource[`${column}${TAIL_COLUMN_SUFFIX}`] = values.map((v, i) =>
      i === currentIdx || i === currentIdx - 1 ? v : null
    );
  }

  return { ...dataset, source: newSource };
}

/**
 * Returns the value of a data point of a series from its metric column. A
 * series with a current period draws a column without some values of the
 * metric, so the tooltip must read the value here.
 */
export function getSeriesMetricValue(
  series: ChartSeries | undefined,
  datasets: EChartOption.Dataset | EChartOption.Dataset[] | undefined,
  dataIndex: number
) {
  const column = series?.encode?.y;
  const dataset = Array.isArray(datasets)
    ? datasets[series?.datasetIndex ?? 0]
    : datasets;

  if (!column || !isColumnSource(dataset?.source)) {
    return;
  }

  return dataset.source[getMetricColumn(column)]?.[dataIndex];
}

/**
 * Returns true when a series has a value to draw for the current period. A
 * bar with a zero has no height, so it has no value to draw. A line with a
 * zero has a point to draw.
 */
export function hasCurrentPeriodValue(
  series: ChartSeries,
  datasets: EChartOption.Dataset[],
  currentPeriodTimestamp: Date
) {
  const dataset = datasets[series.datasetIndex ?? 0];
  const currentIdx = dataset
    ? findCurrentPeriodIdx(dataset, currentPeriodTimestamp)
    : -1;
  const value =
    currentIdx === -1
      ? undefined
      : getSeriesMetricValue(series, datasets, currentIdx);

  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return false;
  }

  return series.type !== "bar" || Number(value) !== 0;
}

/**
 * Returns the series to draw for a series when a current period exists:
 * the series itself, with its line or bars stopped at the last closed period,
 * and the series that draw the current period.
 *
 * The tooltip must read the values of the series with getSeriesMetricValue,
 * so it includes the current period. The current period series are not in
 * the tooltip.
 */
export function createCurrentPeriodSeries(
  series: ChartSeries,
  { seriesIdx }: { seriesIdx: number }
): ChartSeries[] {
  const metric = series.encode?.y;

  if (!metric || (series.type !== "line" && series.type !== "bar")) {
    return [series];
  }

  const color = series.itemStyle?.color as string | undefined;
  const idPrefix = `${series.id ?? `series-${seriesIdx}`}`;
  // The current period series have the name and the hover style (emphasis)
  // of the series, so a hover on the series or on the current period
  // highlights both (see ChartBase).
  const currentPeriodSeriesBase = {
    name: series.name,
    datasetIndex: series.datasetIndex,
    emphasis: series.emphasis,
    tooltip: { show: false },
  };

  if (series.type === "bar") {
    // The current bars use the stack of the series, so they are in the same
    // place on the axis as the closed bars.
    const stack = series.stack ?? idPrefix;

    return [
      {
        ...series,
        stack,
        encode: { ...series.encode, y: `${metric}${CLOSED_BAR_COLUMN_SUFFIX}` },
      },
      {
        ...currentPeriodSeriesBase,
        id: `${idPrefix}-bar${CURRENT_PERIOD_SERIES_ID_SUFFIX}`,
        type: "bar",
        stack,
        encode: { x: "timestamp", y: `${metric}${CURRENT_COLUMN_SUFFIX}` },
        itemStyle: {
          color,
          opacity: 0.5,
          borderColor: color,
          borderType: "dashed",
          borderWidth: 1.5,
        },
      },
    ];
  }

  return [
    {
      ...series,
      encode: { ...series.encode, y: `${metric}${CLOSED_COLUMN_SUFFIX}` },
    },
    {
      ...currentPeriodSeriesBase,
      id: `${idPrefix}-segment${CURRENT_PERIOD_SERIES_ID_SUFFIX}`,
      type: "line",
      smooth: series.smooth,
      encode: { x: "timestamp", y: `${metric}${TAIL_COLUMN_SUFFIX}` },
      symbol: "none",
      lineStyle: { color, type: "dotted", width: 2 },
      itemStyle: { color },
      // The area of the series stops at the last closed period. A lighter
      // area under the segment keeps the area of the chart continuous.
      areaStyle: series.areaStyle
        ? { ...series.areaStyle, opacity: 0.25 }
        : undefined,
    },
    {
      ...currentPeriodSeriesBase,
      id: `${idPrefix}-point${CURRENT_PERIOD_SERIES_ID_SUFFIX}`,
      type: "scatter",
      encode: { x: "timestamp", y: `${metric}${CURRENT_COLUMN_SUFFIX}` },
      symbol: "emptyCircle",
      symbolSize: 8,
      itemStyle: { color, borderColor: color, borderWidth: 2 },
      z: 5,
    },
  ];
}
