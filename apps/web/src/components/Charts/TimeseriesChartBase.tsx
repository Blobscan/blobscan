import type { FC } from "react";
import React, { useMemo } from "react";
import type { BarSeriesOption, LineSeriesOption } from "echarts";
import { useTheme } from "next-themes";

import type { Prettify, TimeseriesMetric } from "~/types";
import { Card } from "../Cards/Card";
import type { TimeseriesDataset } from "../TimeseriesCharts/helpers";
import { ChartBase } from "./ChartBase";
import type { Axis, ChartBaseProps } from "./ChartBase";
import { RANGE_SERIES_FLAG } from "./ChartBase/helpers";

type Timeseries = Pick<
  BarSeriesOption | LineSeriesOption,
  "name" | "id" | "stack"
> & {
  type: "bar" | "line";
  metric: TimeseriesMetric;
  /**
   * The color of the series. Without it, the series gets the color of its
   * dimension (see getDimensionColor).
   */
  color?: ThemeColor;
  /**
   * The opacity of the area under the series, from 0 to 1. Use a low value
   * when the areas of the series overlap.
   */
  areaOpacity?: number;
  lineStyle?: Pick<
    NonNullable<LineSeriesOption["lineStyle"]>,
    "type" | "width"
  >;
};

type ThemeColor = { light: string; dark: string };

/**
 * A band between two metrics, for example the minimum and the maximum of a
 * value. It is drawn below the series.
 */
type Range = {
  lower: TimeseriesMetric;
  upper: TimeseriesMetric;
  color: ThemeColor;
  opacity: number;
};

export type TimeseriesChartProps = Prettify<
  Pick<
    ChartBaseProps,
    "headerControls" | "compact" | "size" | "skeletonOpts" | "isLoading"
  > & {
    dataset?: TimeseriesDataset | TimeseriesDataset[];
  }
>;

export type TimeseriesChartBaseProps = Prettify<
  Omit<ChartBaseProps, "axes" | "series" | "dataset"> & {
    dataset?: TimeseriesDataset | TimeseriesDataset[];
    timeseries?: [Timeseries, ...Timeseries[]];
    range?: Range;
    yAxis: Axis;
  }
>;

export type TimeseriesChartComponent = FC<TimeseriesChartProps> & {
  displayName?: string;
  requiredMetrics: [TimeseriesMetric, ...TimeseriesMetric[]];
};

function getSeriesStyle(
  { color, areaOpacity }: Pick<Timeseries, "color" | "areaOpacity">,
  themeMode: "light" | "dark"
) {
  const resolvedColor = color?.[themeMode];

  return {
    ...(resolvedColor ? { itemStyle: { color: resolvedColor } } : {}),
    ...(resolvedColor || areaOpacity !== undefined
      ? {
          areaStyle: {
            ...(resolvedColor ? { color: resolvedColor } : {}),
            ...(areaOpacity !== undefined ? { opacity: areaOpacity } : {}),
          },
        }
      : {}),
  };
}

function getRangeColumn({ lower, upper }: Range) {
  return `${upper}-${lower}`;
}

/**
 * Adds the range column to the dataset: the upper value minus the lower value.
 */
function addRangeColumn(dataset: TimeseriesDataset, range: Range) {
  const source = dataset.source as Record<string, unknown[] | undefined>;
  const lowerValues = source[range.lower] ?? [];
  const upperValues = source[range.upper] ?? [];

  return {
    ...dataset,
    source: {
      ...dataset.source,
      [getRangeColumn(range)]: lowerValues.map((lower, i) => {
        const upper = upperValues[i];

        return lower === null ||
          lower === undefined ||
          upper === null ||
          upper === undefined
          ? null
          : Number(upper) - Number(lower);
      }),
    },
  } as TimeseriesDataset;
}

/**
 * Returns the two stacked series that draw the range band: a hidden series
 * at the lower value, and a series with the range column that fills the area
 * above it.
 */
function getRangeSeries(
  range: Range,
  datasetIndex: number,
  themeMode: "light" | "dark"
) {
  const color = range.color[themeMode];
  const base = {
    [RANGE_SERIES_FLAG]: true,
    type: "line" as const,
    datasetIndex,
    stack: `range-${datasetIndex}`,
    symbol: "none",
    silent: true,
    z: 1,
    lineStyle: { opacity: 0 },
    emphasis: { disabled: true },
    tooltip: { show: false },
  };

  // ChartBase sorts the series by name, and the first series of a stack is
  // its base. These names keep the hidden series first.
  return [
    {
      ...base,
      name: `range-${datasetIndex}-1-base`,
      areaStyle: undefined,
      encode: { x: "timestamp", y: range.lower },
    },
    {
      ...base,
      name: `range-${datasetIndex}-2-band`,
      itemStyle: { color },
      areaStyle: { color, opacity: range.opacity },
      encode: { x: "timestamp", y: getRangeColumn(range) },
    },
  ];
}

function getSeries(
  dataset: TimeseriesDataset | TimeseriesDataset[],
  seriesProp: [Timeseries, ...Timeseries[]],
  themeMode: "light" | "dark"
) {
  if (Array.isArray(dataset)) {
    return seriesProp.flatMap(({ color, areaOpacity, ...series }) =>
      dataset.map((d, i) => ({
        ...series,
        ...getSeriesStyle({ color, areaOpacity }, themeMode),
        datasetIndex: i,
        datasetId: d.id,
        id: d.id,
        encode: { x: "timestamp", y: series.metric },
      }))
    );
  }

  return seriesProp.map(({ color, areaOpacity, ...series }) => ({
    ...series,
    ...getSeriesStyle({ color, areaOpacity }, themeMode),
    encode: { x: "timestamp", y: series.metric },
  }));
}

export const TimeseriesChartBase: FC<TimeseriesChartBaseProps> = ({
  dataset: datasetProp,
  yAxis,
  timeseries,
  range,
  ...restProps
}) => {
  const { resolvedTheme } = useTheme();
  const themeMode = resolvedTheme as "light" | "dark";
  const dataset = useMemo(() => {
    if (!datasetProp || !range) {
      return datasetProp;
    }

    return Array.isArray(datasetProp)
      ? datasetProp.map((d) => addRangeColumn(d, range))
      : addRangeColumn(datasetProp, range);
  }, [datasetProp, range]);
  const series = useMemo(() => {
    if (!dataset || !timeseries) {
      return undefined;
    }

    const datasetCount = Array.isArray(dataset) ? dataset.length : 1;
    const rangeSeries = range
      ? Array.from({ length: datasetCount }, (_, i) =>
          getRangeSeries(range, i, themeMode)
        ).flat()
      : [];

    return [...rangeSeries, ...getSeries(dataset, timeseries, themeMode)];
  }, [dataset, timeseries, range, themeMode]);

  return (
    <Card compact>
      <ChartBase
        axes={{
          x: {
            type: "time",
          },
          y: yAxis,
        }}
        dataset={dataset}
        series={series}
        {...restProps}
      />
    </Card>
  );
};

export function createTimeseriesChart({
  baseProps: { skeletonOpts: baseSkeletonOpts = {}, ...restBaseProps },
  requiredMetrics,
  componentName,
}: {
  baseProps: TimeseriesChartBaseProps;
  requiredMetrics: [TimeseriesMetric, ...TimeseriesMetric[]];
  componentName: string;
}): TimeseriesChartComponent {
  const Chart = function ({
    skeletonOpts = {},
    ...restProps
  }: TimeseriesChartProps) {
    return (
      <TimeseriesChartBase
        skeletonOpts={{
          ...baseSkeletonOpts,
          ...skeletonOpts,
          chart: {
            ...(baseSkeletonOpts?.chart ?? {}),
            ...(skeletonOpts?.chart ?? {}),
          },
          legend: {
            ...(baseSkeletonOpts?.legend ?? {}),
            ...(skeletonOpts?.legend ?? {}),
          },
        }}
        {...restBaseProps}
        {...restProps}
      />
    );
  };

  Chart.displayName = componentName;

  return Object.assign(React.memo(Chart), { requiredMetrics });
}
