import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyBlobGasUsedChartProps = TimeSeriesBaseProps<
  {
    name?: string;
    values: string[];
  }[]
>;

export const DailyBlobGasUsedChart: FC<DailyBlobGasUsedChartProps> = function ({
  days,
  series,
}) {
  return (
    <ChartCard
      title="Daily Blob Gas Used"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: { type: "count", unitType: "none" },
      }}
      options={{
        xAxis: {
          data: days,
        },
        series: series?.map(({ name, values }) => ({
          name,
          data: values,
          type: "bar",
          stack: "total",
        })),
        tooltipExtraOptions: {
          displayTotal: true,
        },
      }}
    />
  );
};
