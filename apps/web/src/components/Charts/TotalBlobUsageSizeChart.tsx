import type { FC } from "react";
import React from "react";

import { ChartCard } from "../Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlobUsageSizeChartProps = MultipleTimeseriesChartProps;

const TotalBlobUsageSizeChart: FC<TotalBlobUsageSizeChartProps> = React.memo(
  ({ datasets, ...restProps }) => {
    return (
      <ChartCard
        title="Total Blob Usage"
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
        dataset={datasets}
        series={datasets?.map(({ id }, i) => ({
          datasetIndex: i,
          datasetId: id,
          id,
          type: "bar",
          stack: "total",
          encode: {
            x: "timestamp",
            y: "totalBlobUsageSize",
          },
        }))}
        options={{
          tooltipExtraOptions: {
            displayTotal: true,
          },
        }}
        {...restProps}
      />
    );
  }
);

TotalBlobUsageSizeChart.displayName = "TotalBlobUsageSizeChart";

export { TotalBlobUsageSizeChart };
