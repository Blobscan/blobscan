import { type FC } from "react";
import { type EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import { type TransformedDailyTransactionStats } from "~/types";
import { ChartBase } from "../ChartBase";

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
  const isEmpty = !days?.length || !transactions?.length;
  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    xAxis: {
      type: "category",
      data: days,
    },
    yAxis: {
      type: "value",
      splitLine: { show: false },
    },
    series: [
      {
        name: "Transactions",
        data: transactions,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };

  return (
    <ChartCard title="Daily Transactions" size="sm" isEmptyChart={isEmpty}>
      <ChartBase options={options} compact={compact} />
    </ChartCard>
  );
};
