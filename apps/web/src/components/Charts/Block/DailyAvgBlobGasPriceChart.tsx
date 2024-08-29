import type { FC } from "react";
import { useMemo } from "react";
import type { EChartOption } from "echarts";

import { arrayBestUnit } from "@blobscan/eth-units";

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
  const { converted, unit } = useMemo(
    () => arrayBestUnit(avgBlobGasPrices),
    [avgBlobGasPrices]
  );

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
        name: "Avg. Blob Gas Prices",
        data: converted,
        type: "bar",
      },
    ],
    animationEasing: "cubicOut",
  };

  return (
    <ChartCard title="Daily Avg. Blob Gas Price" size="sm" options={options} />
  );
};
