import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyTransactionStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyTransactionsProps = {
  days?: TransformedDailyTransactionStats["days"];
  transactions?: TransformedDailyTransactionStats["transactions"];
  compact?: boolean;
};

export const DailyTransactionsChart: FC<DailyTransactionsProps> = function ({
  days,
  transactions,
  compact = false,
}) {
  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    ...buildTimeSeriesOptions(days),
    series: [
      {
        name: "Transactions",
        data: transactions,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };

  return <ChartCard title="Daily Transactions" size="sm" options={options} />;
};
