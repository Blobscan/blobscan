import type { FC } from "react";
import React from "react";

import { ChartCard } from "../Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type DailyBlobUsageSizeChartProps = MultipleTimeseriesChartProps;

const DailyBlobUsageSizeChart: FC<DailyBlobUsageSizeChartProps> = React.memo(
  ({ datasets, ...restProps }) => {
    return (
      <ChartCard
        title="Daily Blob Usage Size"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: {
            type: "count",
            unitType: "byte",
            unit: "B",
            displayUnit: "GiB",
          },
        }}
        options={{
          dataset: datasets,
          series: datasets?.map(({ id }, i) => ({
            datasetIndex: i,
            datasetId: id,
            id,
            type: "bar",
            stack: "total",
            encode: {
              x: "timestamp",
              y: "totalBlobUsageSize",
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

DailyBlobUsageSizeChart.displayName = "DailyBlobUsageSizeChart";

export { DailyBlobUsageSizeChart };
