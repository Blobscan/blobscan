import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TimeSeriesProps } from "../ChartBase/types";

export type DailyBlocksChartProps = TimeSeriesProps<number>;

export const DailyBlocksChart: FC<DailyBlocksChartProps> = function ({
  days,
  series,
  ...restProps
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
      {...restProps}
    />
  );
};
