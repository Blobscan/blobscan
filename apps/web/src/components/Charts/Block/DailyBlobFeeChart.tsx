import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleDailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatWei } from "~/utils";

export type DailyBlobFeeChartProps = Partial<{
  days: SingleDailyBlockStats["day"][];
  blobFees: SingleDailyBlockStats["totalBlobFee"][];
}>;

export const DailyBlobFeeChart: FC<DailyBlobFeeChartProps> = function ({
  days,
  blobFees,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions(days, {
      yAxisTooltip: (value) => formatWei(value),
      yAxisLabel: (value) => formatWei(value),
    }),
    series: [
      {
        name: "Fees",
        data: blobFees,
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartCard title="Daily Blob Fees" size="sm" options={options} />;
};
