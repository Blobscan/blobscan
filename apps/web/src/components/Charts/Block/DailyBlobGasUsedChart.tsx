import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleDailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlobGasUsedChartProps = Partial<{
  days: SingleDailyBlockStats["day"][];
  blobGasUsed: SingleDailyBlockStats["totalBlobGasUsed"][];
  blobAsCalldataGasUsed: SingleDailyBlockStats["totalBlobAsCalldataGasUsed"][];
}>;

export const DailyBlobGasUsedChart: FC<DailyBlobGasUsedChartProps> = function ({
  days,
  blobGasUsed,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions(days, {
      yAxisTooltip: (value) => formatNumber(value),
    }),
    series: [
      {
        name: "Blob Gas Used",
        data: blobGasUsed,
        stack: "gas",
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartCard title="Daily Blob Gas Used" size="sm" options={options} />;
};
