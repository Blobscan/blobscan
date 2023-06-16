import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyTransactionStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

export type DailyTransactionsProps = {
  days: FormattedDailyTransactionStats["days"];
  transactions: FormattedDailyTransactionStats["transactions"];
};

export const DailyTransactionsChart: FC<DailyTransactionsProps> = function ({
  days,
  transactions,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
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
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartBase options={options} />;
};
