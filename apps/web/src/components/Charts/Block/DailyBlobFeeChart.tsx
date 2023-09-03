import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatWei } from "~/utils";

export type DailyBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  blobFees: DailyBlockStats["totalBlobFees"];
};

export const DailyBlobFeeChart: FC<Partial<DailyBlobFeeChartProps>> =
  function ({ days, blobFees }) {
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => formatWei(value),
          yAxisLabel: (value) => formatWei(value),
        },
        yUnit: "ethereum",
      }),
      series: [
        {
          name: "Blob Fees",
          data: blobFees,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return <ChartCard title="Daily Blob Fees" size="sm" options={options} />;
  };
