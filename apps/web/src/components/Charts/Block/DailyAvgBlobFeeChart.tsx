import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatWei } from "~/utils";

export type DailyAvgBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  avgBlobFees: DailyBlockStats["avgBlobFees"];
};

export const DailyAvgBlobFeeChart: FC<Partial<DailyAvgBlobFeeChartProps>> =
  function ({ days, avgBlobFees }) {
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
          name: "Avg. Blob Fees",
          data: avgBlobFees,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard title="Daily Avg. Blob Fee" size="sm" options={options} />
    );
  };
