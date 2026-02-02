import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlocksChartProps = SingleTimeseriesChartProps;

const TotalBlocksChart: FC<TotalBlocksChartProps> = React.memo(function ({
  dataset,
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
      {...restProps}
    />
  );
});

TotalBlocksChart.displayName = "TotalBlocksChart";

export { TotalBlocksChart };
