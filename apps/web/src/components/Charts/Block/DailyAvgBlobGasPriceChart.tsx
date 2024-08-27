import type { FC } from "react";
import { useMemo } from "react";
import type { EChartOption } from "echarts";

import { convertWei } from "@blobscan/eth-units";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyAvgBlobGasPriceChartProps = {
  days: DailyBlockStats["days"];
  avgBlobGasPrices: DailyBlockStats["avgBlobGasPrices"];
};

export const DailyAvgBlobGasPriceChart: FC<
  Partial<DailyAvgBlobGasPriceChartProps>
> = function ({ days, avgBlobGasPrices }) {
  const formattedAvgBlobGasPrices = useMemo(
    () => avgBlobGasPrices?.map((price) => convertWei(price)),
    [avgBlobGasPrices]
  );

  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: (value) => `${formatNumber(value)} Gwei`,
      },
      yUnit: "ethereum",
    }),
    series: [
      {
        name: "Avg. Blob Gas Prices",
        data: formattedAvgBlobGasPrices,
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return (
    <ChartCard title="Daily Avg. Blob Gas Price" size="sm" options={options} />
  );
};
