import type { FC } from "react";
import { useMemo } from "react";
import type { BarSeriesOption, LineSeriesOption } from "echarts";
import { useTheme } from "next-themes";

import type { Prettify, ThemeMode } from "~/types";
import { Card } from "../Cards/Card";
import {
  addDerivedColumns,
  isDerivedMetric,
} from "../TimeseriesCharts/helpers";
import type {
  ChartMetric,
  TimeseriesDataset,
} from "../TimeseriesCharts/helpers";
import { ChartBase } from "./ChartBase";
import type { Axis, ChartBaseProps } from "./ChartBase";

type Timeseries = Pick<
  BarSeriesOption | LineSeriesOption,
  "name" | "id" | "stack" | "z"
> & {
  type: "bar" | "line";
  /**
   * A metric of the dataset, or a derived metric that the chart calculates
   * from the dataset (see DERIVED_METRICS).
   */
  metric: ChartMetric;
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
  ...restProps
}) => {
  const { resolvedTheme } = useTheme();
  const themeMode = resolvedTheme as ThemeMode;
  const dataset = useMemo(() => {
    const derivedMetrics = (timeseries ?? [])
      .map(({ metric }) => metric)
      .filter(isDerivedMetric);

    if (!datasetProp || !derivedMetrics.length) {
      return datasetProp;
    }

    const transform = (d: TimeseriesDataset) =>
      addDerivedColumns(d, derivedMetrics);

    return Array.isArray(datasetProp)
      ? datasetProp.map(transform)
      : transform(datasetProp);
  }, [datasetProp, timeseries]);
  const series = useMemo(() => {
    if (!dataset || !timeseries) {
      return undefined;
    }

    return getSeries(dataset, timeseries, themeMode);
  }, [dataset, timeseries, themeMode]);

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
