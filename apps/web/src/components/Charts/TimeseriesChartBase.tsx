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
   * Fill the area under the line. True by default.
   */
  area?: boolean;
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
  { color, area }: Pick<Timeseries, "color" | "area">,
  themeMode: "light" | "dark"
) {
  const resolvedColor = color?.[themeMode];

  return {
    ...(resolvedColor
      ? {
          itemStyle: { color: resolvedColor },
          areaStyle: { color: resolvedColor },
        }
      : {}),
    ...(area === false ? { areaStyle: undefined } : {}),
  };
}

function getSeries(
  dataset: TimeseriesDataset | TimeseriesDataset[],
  seriesProp: [Timeseries, ...Timeseries[]],
  themeMode: "light" | "dark"
) {
  if (Array.isArray(dataset)) {
    return seriesProp.flatMap(({ color, area, ...series }) =>
      dataset.map((d, i) => ({
        ...series,
        ...getSeriesStyle({ color, area }, themeMode),
        datasetIndex: i,
        datasetId: d.id,
        id: d.id,
        encode: { x: "timestamp", y: series.metric },
      }))
    );
  }

  return seriesProp.map(({ color, area, ...series }) => ({
    ...series,
    ...getSeriesStyle({ color, area }, themeMode),
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
