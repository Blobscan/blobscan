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

export type TimeseriesChartComponent = FC<TimeseriesChartProps> & {
  displayName?: string;
  requiredMetrics: [TimeseriesMetric, ...TimeseriesMetric[]];
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

// Shades of the primary color (see @blobscan/tailwind-config). The average is
// the main line. The maximum and the minimum have a very different intensity,
// and a band fills the range between them.
const AVG_COLOR = { light: "#5D25D4", dark: "#C8AEFA" };
const MAX_MIN_COLOR = { light: "#C8AEFA", dark: "#5D25D4" };
const RANGE_COLOR = { light: "#AE8CF5", dark: "#5D25D4" };
const RANGE_OPACITY = 0.2;
const MAX_MIN_LINE_STYLE = { type: "dashed", width: 2 } as const;

/**
 * Makes a chart that shows the maximum, the average and the minimum of a
 * value, with a band between the maximum and the minimum.
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
      highlightAllSeries: true,
      yAxis,
      range: {
        lower: min,
        upper: max,
        color: RANGE_COLOR,
        opacity: RANGE_OPACITY,
      },
      timeseries: [
        {
          name: `Max. ${label}`,
          type: "line",
          metric: max,
          color: MAX_MIN_COLOR,
          showArea: false,
          lineStyle: MAX_MIN_LINE_STYLE,
        },
        {
          name: `Avg. ${label}`,
          type: "line",
          metric: avg,
          color: AVG_COLOR,
          showArea: false,
          lineStyle: { width: 3 },
        },
        {
          name: `Min. ${label}`,
          type: "line",
          metric: min,
          color: MAX_MIN_COLOR,
          showArea: false,
          lineStyle: MAX_MIN_LINE_STYLE,
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
