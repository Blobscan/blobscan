import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TimeSeriesProps } from "../ChartBase/types";

export type DailyBlobsChartProps = TimeSeriesProps<number>;

const DailyBlobsChart: FC<DailyBlobsChartProps> = React.memo(function ({
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
});

DailyBlobsChart.displayName = "DailyBlobsChart";

export { DailyBlobsChart };
