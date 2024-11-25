import type { FC } from "react";
import type { EChartOption } from "echarts";

import { formatWei, prettyFormatWei } from "@blobscan/eth-format";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { DailyTransactionStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyAvgMaxBlobGasFeeChartProps = {
  days: DailyTransactionStats["days"];
  avgMaxBlobGasFees: DailyTransactionStats["avgMaxBlobGasFees"];
  compact: boolean;
};

export const DailyAvgMaxBlobGasFeeChart: FC<
  Partial<DailyAvgMaxBlobGasFeeChartProps>
> = function ({ days, avgMaxBlobGasFees, compact = false }) {
  const { unit } = useScaledWeiAmounts(avgMaxBlobGasFees);

  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: (value) => formatWei(value, { toUnit: unit }),
        yAxisLabel: (value) =>
          prettyFormatWei(value, { toUnit: unit, hideUnit: true }),
      },
    }),
    series: [
      {
        name: "Avg. Max Blob Gas Fees",
        data: avgMaxBlobGasFees,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };

  return (
    <ChartCard
      title={`Daily Avg. Max Blob Gas Fee (in ${unit})`}
      size="sm"
      options={options}
    />
  );
};
