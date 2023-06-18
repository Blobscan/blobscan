import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyTransactionStats } from "~/utils";
import { ChartBase } from "../ChartBase";

export type DailyTransactionsProps = {
  days: FormattedDailyTransactionStats["days"];
  transactions: FormattedDailyTransactionStats["transactions"];
  seriesType?: EChartOption.Series["type"];
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

  return <ChartBase options={options} compact={compact} />;
};
