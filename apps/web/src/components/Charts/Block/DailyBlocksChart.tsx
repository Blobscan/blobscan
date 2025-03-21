import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { EChartCompliantDailyStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlocksChartProps = Partial<{
  days: EChartCompliantDailyStats["day"][];
  totalBlocks: EChartCompliantDailyStats["totalBlocks"][];
}>;

export const DailyBlocksChart: FC<Partial<DailyBlocksChartProps>> = function ({
  days,
  totalBlocks,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: (value) => formatNumber(value),
      },
    }),
    series: [
      {
        name: "Total Blocks",
        data: totalBlocks,
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartCard title="Daily Blocks" size="sm" options={options} />;
};
