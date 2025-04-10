import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyBlocksChartProps = TimeSeriesBaseProps<
  {
    name?: string;
    values: number[];
  }[]
>;

export const DailyBlocksChart: FC<DailyBlocksChartProps> = function ({
  days,
  series,
}) {
  return (
    <ChartCard
      title="Daily Blocks"
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
