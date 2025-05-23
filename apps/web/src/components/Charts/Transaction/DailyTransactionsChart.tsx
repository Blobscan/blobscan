import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyTransactionsChartProps = TimeSeriesBaseProps<number>;

const DailyTransactionsChart: FC<DailyTransactionsChartProps> = React.memo(
  function ({ days, series, ...restProps }) {
    return (
      <ChartCard
        title="Daily Transactions"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count", unitType: "none" },
        }}
        options={{
          xAxis: {
            data: days,
          },
          series: series?.map(({ name, values }) => ({
            name: name,
            data: values,
            type: "bar",
            stack: "total",
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
