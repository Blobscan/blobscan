import type { FC } from "react";
import type { EChartOption } from "echarts";

import { findBestUnit, formatWei, prettyFormatWei } from "@blobscan/eth-units";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyAvgBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  avgBlobFees: DailyBlockStats["avgBlobFees"];
};

export const DailyAvgBlobFeeChart: FC<Partial<DailyAvgBlobFeeChartProps>> =
  function ({ days, avgBlobFees }) {
    const { unit } = useScaledWeiAmounts(avgBlobFees);

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
          name: "Avg. Blob Fees",
          data: avgBlobFees,
          type: "line",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard title="Daily Avg. Blob Fee" size="sm" options={options} />
    );
  };
