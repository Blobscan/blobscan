import type { FC } from "react";
import { useMemo } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { formatNumber } from "~/utils";
import { buildTimeSeriesOptions, convertWei } from "~/utils";

export type DailyBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  blobFees: DailyBlockStats["totalBlobFees"];
};

export const DailyBlobFeeChart: FC<Partial<DailyBlobFeeChartProps>> =
  function ({ days, blobFees }) {
    const formattedBlobFees = useMemo(
      () => blobFees?.map((fee) => convertWei(fee)),
      [blobFees]
    );
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => `${formatNumber(value)} gwei`,
        },
        yUnit: "ethereum",
      }),
      series: [
        {
          name: "Blob Fees",
          data: formattedBlobFees,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return <ChartCard title="Daily Blob Fees" size="sm" options={options} />;
  };
