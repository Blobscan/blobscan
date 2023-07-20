import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyBlockStats } from "~/types";

export type DailyBlocksChartProps = {
  days?: TransformedDailyBlockStats["days"];
  blocks?: TransformedDailyBlockStats["blocks"];
};

export const DailyBlocksChart: FC<DailyBlocksChartProps> = function ({
  days,
  blocks,
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
        data: blocks,
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartCard title="Daily Blocks" size="sm" options={options} />;
};
