import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlocksChartProps = {
  days: DailyBlockStats["days"];
  blocks: DailyBlockStats["totalBlocks"];
};

export const DailyBlocksChart: FC<Partial<DailyBlocksChartProps>> = function ({
  days,
  blocks,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions(days, {
      yAxisTooltip: (value) => formatNumber(value),
    }),
    series: [
      {
        name: "Total Blocks",
        data: blocks,
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartCard title="Daily Blocks" size="sm" options={options} />;
};
