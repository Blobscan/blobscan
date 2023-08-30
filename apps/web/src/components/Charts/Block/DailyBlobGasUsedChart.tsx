import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlobGasUsedChartProps = {
  days: DailyBlockStats["days"];
  blobGasUsed: DailyBlockStats["totalBlobGasUsed"];
  blobAsCalldataGasUsed: DailyBlockStats["totalBlobAsCalldataGasUsed"];
};

export const DailyBlobGasUsedChart: FC<Partial<DailyBlobGasUsedChartProps>> =
  function ({ days, blobGasUsed }) {
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions(days, {
        yAxisTooltip: (value) => formatNumber(value),
      }),
      series: [
        {
          name: "Blob Gas Used",
          data: blobGasUsed,
          stack: "gas",
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard title="Daily Blob Gas Used" size="sm" options={options} />
    );
  };
