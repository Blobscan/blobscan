import type { FC } from "react";
import type { EChartOption } from "echarts";

import { findBestUnit, formatWei, prettyFormatWei } from "@blobscan/eth-units";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyBlobGasUsedChartProps = Partial<{
  days: DailyBlockStats["days"];
  blobGasUsed: DailyBlockStats["totalBlobGasUsed"];
}>;

const BaseChart: FC<DailyBlobGasUsedChartProps & { title: string }> =
  function ({ days, blobGasUsed, title }) {
    const data = blobGasUsed?.map((x) => Number(x));
    const { unit } = useScaledWeiAmounts(data);
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => formatWei(value, findBestUnit(value)),
          yAxisLabel: (value) => prettyFormatWei(value, unit),
        },
      }),
      grid: {
        containLabel: true,
      },
      series: [
        {
          name: "Blob Gas Used",
          data: data,
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
