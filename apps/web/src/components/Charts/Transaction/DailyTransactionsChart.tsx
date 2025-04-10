import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyStats } from "~/types";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyTransactionsChartProps = TimeSeriesBaseProps<
  {
    name?: string;
    values: DailyStats["totalTransactions"][];
  }[]
>;

export const DailyTransactionsChart: FC<DailyTransactionsChartProps> =
  function ({ days, series }) {
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
      />
    );
  };
