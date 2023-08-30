import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyTransactionStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyTransactionsProps = {
  days: DailyTransactionStats["days"];
  transactions: DailyTransactionStats["totalTransactions"];
  compact: boolean;
};

export const DailyTransactionsChart: FC<Partial<DailyTransactionsProps>> =
  function ({ days, transactions, compact = false }) {
    const options: EChartOption<
      EChartOption.SeriesBar | EChartOption.SeriesLine
    > = {
      ...buildTimeSeriesOptions(days, {
        yAxisTooltip: (value) => formatNumber(value),
      }),
      series: [
        {
          name: "Total Transactions",
          data: transactions,
          type: compact ? "line" : "bar",
          smooth: true,
        },
      ],
    };

    return <ChartCard title="Daily Transactions" size="sm" options={options} />;
  };
