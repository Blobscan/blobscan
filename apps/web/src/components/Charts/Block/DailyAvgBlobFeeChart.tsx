import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleDailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatWei } from "~/utils";

export type DailyAvgBlobFeeChartProps = Partial<{
  days: SingleDailyBlockStats["day"][];
  avgBlobFees: SingleDailyBlockStats["avgBlobFee"][];
}>;

export const DailyAvgBlobFeeChart: FC<DailyAvgBlobFeeChartProps> = function ({
  days,
  avgBlobFees,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions(days, {
      yAxisTooltip: (value) =>
        formatWei(value, {
          displayFullAmount: true,
        }),
      yAxisLabel: (value) => formatWei(value, { displayFullAmount: false }),
    }),
    series: [
      {
        name: "Avg. Fee",
        data: avgBlobFees,
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartCard title="Daily Avg. Blob Fee" size="sm" options={options} />;
};
