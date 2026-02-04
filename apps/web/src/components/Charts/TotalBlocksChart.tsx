import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalBlocksChartProps = SingleTimeseriesChartProps;

const TotalBlocksChartInner: FC<TotalBlocksChartProps> = function ({
  dataset,
  skeletonOpts = {},
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Blocks"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: { type: "count" },
      }}
      dataset={dataset}
      series={
        dataset
          ? [
              {
                name: "Total Blocks",
                type: "bar",
                stack: "total",
                encode: {
                  x: "timestamp",
                  y: "totalBlocks",
                },
              },
            ]
          : undefined
      }
      skeletonOpts={{
        ...skeletonOpts,
        chart: {
          ...(skeletonOpts?.chart ?? {}),
          variant: "bar",
        },
        legend: {
          ...(skeletonOpts?.legend ?? {}),
          itemCount: 1,
        },
      }}
      {...restProps}
    />
  );
};

export const TotalBlocksChart = defineTimeseriesChart(
  TotalBlocksChartInner,
  ["totalBlocks"],
  "TotalBlocksChart"
);
