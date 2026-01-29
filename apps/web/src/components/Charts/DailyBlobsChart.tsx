import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type DailyBlobsChartProps = MultipleTimeseriesChartProps;

const DailyBlobsChart: FC<DailyBlobsChartProps> = React.memo(function ({
  datasets: dataset,
  ...restProps
}) {
  return (
    <ChartCard
      title="Daily Blobs"
      metricInfo={{
        xAxis: { type: "time" },
        yAxis: { type: "count" },
      }}
      options={{
        dataset: dataset,
        series: dataset?.map(({ id }, i) => ({
          datasetIndex: i,
          datasetId: id,
          id: id,
          type: "bar",
          stack: "total",
          encode: {
            x: "timestamp",
            y: "totalBlobs",
          },
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
