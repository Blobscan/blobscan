import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyStats } from "~/types";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyBlobsChartProps = TimeSeriesBaseProps<
  {
    name?: string;
    values: DailyStats["totalBlobs"][];
  }[]
>;

export const DailyBlobsChart: FC<DailyBlobsChartProps> = function ({
  days,
  series,
  ...restProps
}) {
  return (
    <ChartCard
      title="Daily Blobs"
      metricInfo={{
        xAxis: { type: "time" },
        yAxis: { type: "count", unitType: "none" },
      }}
      options={{
        xAxis: {
          data: days,
        },
        series: series?.map(({ name, values }) => ({
          name: name,
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
