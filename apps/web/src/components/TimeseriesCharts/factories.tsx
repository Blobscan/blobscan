/**
 * Functions that make timeseries chart components. Put other chart helpers in
 * helpers.ts.
 */
import type { FC } from "react";
import React from "react";

import type { TimeseriesMetric } from "~/types";
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
