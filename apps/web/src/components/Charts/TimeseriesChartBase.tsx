import type { FC } from "react";
import React from "react";
import type { BarSeriesOption, LineSeriesOption } from "echarts";
import { useTheme } from "next-themes";

import type { Prettify, TimeseriesMetric } from "~/types";
import { Card } from "../Cards/Card";
import type { TimeseriesDataset } from "../TimeseriesCharts/helpers";
import { ChartBase } from "./ChartBase";
import type { Axis, ChartBaseProps } from "./ChartBase";

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
  color?: { light: string; dark: string };
  /**
   * The opacity of the area under the series, from 0 to 1. Use a low value
   * when the areas of the series overlap.
   */
  areaOpacity?: number;
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
  dataset,
  yAxis,
  timeseries,
  ...restProps
}) => {
  const { resolvedTheme } = useTheme();
  const series =
    dataset && timeseries
      ? getSeries(dataset, timeseries, resolvedTheme as "light" | "dark")
      : undefined;

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
