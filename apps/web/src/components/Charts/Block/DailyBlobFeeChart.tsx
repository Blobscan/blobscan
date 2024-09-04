import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { DailyBlockStats } from "~/types";
import { formatNumber } from "~/utils";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  blobFees: DailyBlockStats["totalBlobFees"];
};

export const DailyBlobFeeChart: FC<Partial<DailyBlobFeeChartProps>> =
  function ({ days, blobFees }) {
    const { scaledValues, unit } = useScaledWeiAmounts(
      blobFees?.map((x) => Number(x))
    );

    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => `${formatNumber(value)} ${unit}`,
          yAxisLabel: (value) => `${formatNumber(value)} ${unit}`,
        },
        yUnit: "ethereum",
      }),
      grid: {
        containLabel: true,
      },
      series: [
        {
          name: "Blob Fees",
          data: scaledValues,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return <ChartCard title="Daily Blob Fees" size="sm" options={options} />;
  };
