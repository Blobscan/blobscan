import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { formatNumber, useArrayBestUnit } from "~/utils";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyAvgBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  avgBlobFees: DailyBlockStats["avgBlobFees"];
};

export const DailyAvgBlobFeeChart: FC<Partial<DailyAvgBlobFeeChartProps>> =
  function ({ days, avgBlobFees }) {
    const { converted, unit } = useArrayBestUnit(avgBlobFees);

    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => `${formatNumber(value)} ${unit}`,
        },
        yUnit: "ethereum",
      }),
      series: [
        {
          name: "Avg. Blob Fees",
          data: converted,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard title="Daily Avg. Blob Fee" size="sm" options={options} />
    );
  };
