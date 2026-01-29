import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type DailyBlocksChartProps = SingleTimeseriesChartProps;

const DailyBlocksChart: FC<DailyBlocksChartProps> = React.memo(function ({
  dataset,
  ...restProps
}) {
  return (
    <ChartCard
      title="Daily Blocks"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: { type: "count" },
      }}
      options={{
        dataset,
        series: dataset
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
          : undefined,
        tooltipExtraOptions: {
          displayTotal: true,
        },
      }}
      {...restProps}
    />
  );
});

DailyBlocksChart.displayName = "DailyBlocksChart";

export { DailyBlocksChart };
