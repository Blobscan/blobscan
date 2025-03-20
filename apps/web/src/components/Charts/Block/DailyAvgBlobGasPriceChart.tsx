import type { FC } from "react";
import type { EChartOption } from "echarts";

import { formatWei, prettyFormatWei } from "@blobscan/eth-format";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { EChartCompliantDailyStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyAvgBlobGasPriceChartProps = {
  days: EChartCompliantDailyStats["day"][];
  avgBlobGasPrices: EChartCompliantDailyStats["avgBlobGasPrice"][];
};

export const DailyAvgBlobGasPriceChart: FC<
  Partial<DailyAvgBlobGasPriceChartProps>
> = function ({ days, avgBlobGasPrices }) {
  const { unit } = useScaledWeiAmounts(avgBlobGasPrices);

  const options: EChartOption<EChartOption.Series> = {
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
        name: "Avg. Blob Gas Prices",
        data: avgBlobGasPrices,
        type: "line",
      },
    ],
    animationEasing: "cubicOut",
  };

  return (
    <ChartCard
      title={`Daily Avg. Blob Gas Price (in ${unit})`}
      size="sm"
      options={options}
    />
  );
};
