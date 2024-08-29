import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyTransactionStats } from "~/types";
import {
  buildTimeSeriesOptions,
  formatNumber,
  useArrayBestUnit,
} from "~/utils";

export type DailyAvgMaxBlobGasFeeChartProps = {
  days: DailyTransactionStats["days"];
  avgMaxBlobGasFees: DailyTransactionStats["avgMaxBlobGasFees"];
  compact: boolean;
};

export const DailyAvgMaxBlobGasFeeChart: FC<
  Partial<DailyAvgMaxBlobGasFeeChartProps>
> = function ({ days, avgMaxBlobGasFees, compact = false }) {
  const { converted, unit } = useArrayBestUnit(avgMaxBlobGasFees);

  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: (value) => `${formatNumber(value)} ${unit}`,
      },
    }),
    series: [
      {
        name: "Avg. Max Blob Gas Fees",
        data: converted,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };

  return (
    <ChartCard
      title="Daily Avg. Max Blob Gas Fee"
      size="sm"
      options={options}
    />
  );
};
