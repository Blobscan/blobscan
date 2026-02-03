import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type TotalTransactionsChartProps = MultipleTimeseriesChartProps;

const TotalTransactionsChart: FC<TotalTransactionsChartProps> = React.memo(
  function ({ datasets, loadingOpts, ...restProps }) {
    return (
      <ChartCard
        title="Total Transactions"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        dataset={datasets}
        series={datasets?.map(({ id }, i) => ({
          datasetId: id,
          datasetIndex: i,
          id,
          type: "bar",
          stack: "total",
          encode: {
            x: "timestamp",
            y: "totalTransactions",
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

TotalTransactionsChart.displayName = "TotalTransactionsChart";

export { TotalTransactionsChart };
