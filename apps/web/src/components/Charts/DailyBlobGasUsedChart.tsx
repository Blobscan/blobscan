import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type DailyBlobGasUsedChartProps = MultipleTimeseriesChartProps;

const DailyBlobGasUsedChart: FC<DailyBlobGasUsedChartProps> = React.memo(
  function ({ datasets, ...restProps }) {
    return (
      <ChartCard
        title="Daily Blob Gas Used"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        options={{
          dataset: datasets,
          series: datasets?.map(({ id }, i) => ({
            datasetIndex: i,
            datasetId: id,
            id: id,
            type: "bar",
            stack: "total",
            encode: {
              x: "timestamp",
              y: "totalBlobGasUsed",
            },
          })),
          tooltipExtraOptions: {
            displayTotal: true,
          },
        }}
        {...restProps}
      />
    );
  }
);

DailyBlobGasUsedChart.displayName = "DailyBlobGasUsedChart";

export { DailyBlobGasUsedChart };
