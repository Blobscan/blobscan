import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlobGasUsedChartProps = MultipleTimeseriesChartProps;

const TotalBlobGasUsedChart: FC<TotalBlobGasUsedChartProps> = React.memo(
  function ({ datasets, loadingOpts, ...restProps }) {
    return (
      <ChartCard
        title="Total Blob Gas Used"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        dataset={datasets}
        series={datasets?.map(({ id }, i) => ({
          datasetIndex: i,
          datasetId: id,
          id: id,
          type: "bar",
          stack: "total",
          encode: {
            x: "timestamp",
            y: "totalBlobGasUsed",
          },
        }))}
        options={{
          tooltip: {
            displayTotal: true,
          },
          loading: {
            chartType: "bar",
            timeFrame: loadingOpts?.timeFrame,
          },
        }}
        {...restProps}
      />
    );
  }
);

TotalBlobGasUsedChart.displayName = "TotalBlobGasUsedChart";

export { TotalBlobGasUsedChart };
