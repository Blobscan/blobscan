import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type DailyTransactionsChartProps = MultipleTimeseriesChartProps;

const DailyTransactionsChart: FC<DailyTransactionsChartProps> = React.memo(
  function ({ datasets, ...restProps }) {
    return (
      <ChartCard
        title="Daily Transactions"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        options={{
          dataset: datasets,
          series: datasets?.map(({ id }, i) => ({
            datasetId: id,
            datasetIndex: i,
            id,
            type: "bar",
            stack: "total",
            encode: {
              x: "timestamp",
              y: "totalTransactions",
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

DailyTransactionsChart.displayName = "DailyTransactionsChart";

export { DailyTransactionsChart };
