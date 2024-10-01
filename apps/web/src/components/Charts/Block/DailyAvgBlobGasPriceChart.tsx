import type { FC } from "react";
import type { EChartOption } from "echarts";

import { findBestUnit, formatWei, prettyFormatWei } from "@blobscan/eth-units";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyAvgBlobGasPriceChartProps = {
  days: DailyBlockStats["days"];
  avgBlobGasPrices: DailyBlockStats["avgBlobGasPrices"];
};

export const DailyAvgBlobGasPriceChart: FC<
  Partial<DailyAvgBlobGasPriceChartProps>
> = function ({ days, avgBlobGasPrices }) {
  const { unit } = useScaledWeiAmounts(avgBlobGasPrices);

  const options: EChartOption<EChartOption.Series> = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: (value) => formatWei(value, findBestUnit(value)),
        yAxisLabel: (value) => prettyFormatWei(value, unit),
      },
      yUnit: "ethereum",
    }),
    grid: {
      containLabel: true,
    },
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
    <ChartCard title="Daily Avg. Blob Gas Price" size="sm" options={options} />
  );
};
