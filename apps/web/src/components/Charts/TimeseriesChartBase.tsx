import type { FC } from "react";
import React, { useMemo } from "react";
import type { BarSeriesOption, LineSeriesOption } from "echarts";
import { useTheme } from "next-themes";

import type { Prettify, ThemeMode, TimeseriesMetric } from "~/types";
import { Card } from "../Cards/Card";
import type { TimeseriesDataset } from "../TimeseriesCharts/helpers";
import { ChartBase } from "./ChartBase";
import type { Axis, ChartBaseProps } from "./ChartBase";
import { getRangeSeriesId, getRangeSeriesName } from "./ChartBase/helpers";
import type { RangeBounds, RangeSeriesPart } from "./ChartBase/helpers";

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
   * Fill the area under the series. The default is true. Set it to false
   * when the areas of the series cover each other.
   */
  showArea?: boolean;
  lineStyle?: Pick<
    NonNullable<LineSeriesOption["lineStyle"]>,
    "type" | "width"
  >;
};

type ThemeColor = Record<ThemeMode, string>;

/**
 * A band between two metrics, for example the minimum and the maximum of a
 * value. It is drawn below the series.
 */
type Range = RangeBounds & {
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
  { color, showArea = true }: Pick<Timeseries, "color" | "showArea">,
  themeMode: ThemeMode
) {
  const resolvedColor = color?.[themeMode];

  if (!showArea) {
    return {
      ...(resolvedColor ? { itemStyle: { color: resolvedColor } } : {}),
      // Remove the area that ChartBase gives to all the series.
      areaStyle: undefined,
    };
  }

  return resolvedColor
    ? {
        itemStyle: { color: resolvedColor },
        areaStyle: { color: resolvedColor },
      }
    : {};
}

function getRangeColumn({ lower, upper }: RangeBounds) {
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
  themeMode: ThemeMode
) {
  const color = range.color[themeMode];
  const name = getRangeSeriesName(range, datasetIndex);
  const getPartOptions = (part: RangeSeriesPart) => ({
    id: getRangeSeriesId(range, datasetIndex, part),
    name,
    type: "line" as const,
    datasetIndex,
    stack: name,
    symbol: "none",
    silent: true,
    z: 1,
    lineStyle: { opacity: 0 },
    emphasis: { disabled: true },
    tooltip: { show: false },
  });

  // The first series of a stack is its base. ChartBase keeps the range
  // series in this order.
  return [
    {
      ...getPartOptions("base"),
      areaStyle: undefined,
      encode: { x: "timestamp", y: range.lower },
    },
    {
      ...getPartOptions("band"),
      itemStyle: { color },
      areaStyle: { color, opacity: range.opacity },
      encode: { x: "timestamp", y: getRangeColumn(range) },
    },
  ];
}

function getSeries(
  dataset: TimeseriesDataset | TimeseriesDataset[],
  seriesProp: [Timeseries, ...Timeseries[]],
  themeMode: ThemeMode
) {
  if (Array.isArray(dataset)) {
    return seriesProp.flatMap(({ color, showArea, ...series }) =>
      dataset.map((d, i) => ({
        ...series,
        ...getSeriesStyle({ color, showArea }, themeMode),
        datasetIndex: i,
        datasetId: d.id,
        id: d.id,
        encode: { x: "timestamp", y: series.metric },
      }))
    );
  }

  return seriesProp.map(({ color, showArea, ...series }) => ({
    ...series,
    ...getSeriesStyle({ color, showArea }, themeMode),
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
  const themeMode = resolvedTheme as ThemeMode;
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
