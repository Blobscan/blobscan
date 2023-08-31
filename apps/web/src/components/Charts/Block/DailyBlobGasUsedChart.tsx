import type { FC } from "react";
import { useMemo } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, cumulativeSum, formatNumber } from "~/utils";

export type DailyBlobGasUsedChartProps = Partial<{
  days: DailyBlockStats["days"];
  blobGasUsed: DailyBlockStats["totalBlobGasUsed"];
}>;

const BaseChart: FC<DailyBlobGasUsedChartProps & { title: string }> =
  function ({ days, blobGasUsed, title }) {
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => formatNumber(value),
        },
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

    return <ChartCard title={title} size="sm" options={options} />;
  };

export const DailyBlobGasUsedChart: FC<DailyBlobGasUsedChartProps> = function (
  props
) {
  return <BaseChart title="Daily Blob Gas Used" {...props} />;
};

export const DailyCumulativeBlobGasUsedChart: FC<DailyBlobGasUsedChartProps> =
  function ({ blobGasUsed, days }) {
    const cumulativeBlobGasUsed = useMemo(
      () => (blobGasUsed ? cumulativeSum(blobGasUsed) : undefined),
      [blobGasUsed]
    );

    return (
      <BaseChart
        title="Cumulative Blob Gas Used"
        blobGasUsed={cumulativeBlobGasUsed}
        days={days}
      />
    );
  };
