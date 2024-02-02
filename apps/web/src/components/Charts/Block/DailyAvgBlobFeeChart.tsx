import type { FC } from "react";
import { useMemo } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { convertWei, formatNumber } from "~/utils";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyAvgBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  avgBlobFees: DailyBlockStats["avgBlobFees"];
};

export const DailyAvgBlobFeeChart: FC<Partial<DailyAvgBlobFeeChartProps>> =
  function ({ days, avgBlobFees }) {
    const formattedAvgBlobFees = useMemo(
      () => avgBlobFees?.map((fee) => convertWei(fee)),
      [avgBlobFees]
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
          name: "Avg. Blob Fees",
          data: formattedAvgBlobFees,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard title="Daily Avg. Blob Fee" size="sm" options={options} />
    );
  };
