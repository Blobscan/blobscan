import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyBlockStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

export type DailyBlocksChartProps = {
  days: FormattedDailyBlockStats["days"];
  blocks: FormattedDailyBlockStats["blocks"];
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

  return <ChartBase options={options} />;
};
