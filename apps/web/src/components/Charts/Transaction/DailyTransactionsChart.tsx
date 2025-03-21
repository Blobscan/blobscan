import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { EChartCompliantDailyStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyTransactionsProps = Partial<{
  days: EChartCompliantDailyStats["day"][];
  totalTransactions: EChartCompliantDailyStats["totalTransactions"][];
  compact: boolean;
  opts?: EChartOption<EChartOption.SeriesBar | EChartOption.SeriesLine>;
}>;

export const DailyTransactionsChart: FC<DailyTransactionsProps> = function ({
  days,
  totalTransactions,
  compact = false,
  opts = {},
}) {
  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: (value) => formatNumber(value),
      },
    }),
    series: [
      {
        name: "Total Transactions",
        data: totalTransactions,
        type: compact ? "line" : "bar",
      },
    ],
    ...opts,
  };

  return <ChartCard title="Daily Transactions" size="sm" options={options} />;
};
