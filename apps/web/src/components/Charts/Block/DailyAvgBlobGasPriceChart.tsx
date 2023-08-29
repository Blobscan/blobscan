import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleDailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatWei } from "~/utils";

export type DailyAvgBlobGasPriceChartProps = Partial<{
  days: SingleDailyBlockStats["day"][];
  avgBlobGasPrice: SingleDailyBlockStats["avgBlobGasPrice"][];
}>;

export const DailyAvgBlobGasPriceChart: FC<DailyAvgBlobGasPriceChartProps> =
  function ({ days, avgBlobGasPrice }) {
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions(days, {
        yAxisTooltip: (value) => formatWei(value),
        yAxisLabel: (value) => formatWei(value, { displayFullAmount: false }),
      }),
      series: [
        {
          name: "Avg. Gas Price",
          data: avgBlobGasPrice,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard
        title="Daily Avg. Blob Gas Price"
        size="sm"
        options={options}
      />
    );
  };
