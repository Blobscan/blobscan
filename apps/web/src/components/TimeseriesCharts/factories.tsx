/**
 * Functions that make timeseries chart components. Put other chart helpers in
 * helpers.ts.
 */
import type { FC } from "react";
import React from "react";

import type { TimeseriesMetric } from "~/types";
import type { Axis } from "../Charts/ChartBase";
import { TimeseriesChartBase } from "../Charts/TimeseriesChartBase";
import type {
  TimeseriesChartBaseProps,
  TimeseriesChartProps,
} from "../Charts/TimeseriesChartBase";
import {
  GLOBAL_MAIN_SERIES_COLOR,
  GLOBAL_SECONDARY_SERIES_COLOR,
} from "./colors";

export type TimeseriesChartComponent = FC<TimeseriesChartProps> & {
  displayName?: string;
  requiredMetrics: [TimeseriesMetric, ...TimeseriesMetric[]];
  /**
   * The unit that the chart shows its values in (e.g. "Gwei" or "USD").
   */
  yUnit?: string;
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

  const { displayUnit, unit } = restBaseProps.yAxis;

  return Object.assign(React.memo(Chart), {
    requiredMetrics,
    yUnit: displayUnit ?? unit,
  });
}

// The average is the main line. The maximum and the minimum have a very
// different intensity and no area. They are drawn above the area of the
// average, because the area fills the chart up to the average line and covers
// the minimum.
const MAX_MIN_SERIES_STYLE = {
  type: "line",
  color: GLOBAL_SECONDARY_SERIES_COLOR,
  showArea: false,
  lineStyle: { width: 2 },
  z: 3,
} as const;

/**
 * Makes a chart that shows the maximum, the average and the minimum of a
 * value.
 */
export function createMaxAvgMinChart({
  title,
  label,
  metrics: { max, avg, min },
  yAxis,
  componentName,
}: {
  title: string;
  /** The series names are "Max. <label>", "Avg. <label>" and "Min. <label>". */
  label: string;
  metrics: {
    max: TimeseriesMetric;
    avg: TimeseriesMetric;
    min: TimeseriesMetric;
  };
  yAxis: Axis;
  componentName: string;
}): TimeseriesChartComponent {
  return createTimeseriesChart({
    baseProps: {
      title,
      yAxis,
      timeseries: [
        {
          ...MAX_MIN_SERIES_STYLE,
          name: `Max. ${label}`,
          metric: max,
        },
        {
          name: `Avg. ${label}`,
          type: "line",
          metric: avg,
          color: GLOBAL_MAIN_SERIES_COLOR,
          lineStyle: { width: 3 },
        },
        {
          ...MAX_MIN_SERIES_STYLE,
          name: `Min. ${label}`,
          metric: min,
        },
      ],
      skeletonOpts: {
        chart: {
          variant: "line",
        },
        legend: {
          itemCount: 3,
        },
      },
    },
    requiredMetrics: [max, avg, min],
    componentName,
  });
}
