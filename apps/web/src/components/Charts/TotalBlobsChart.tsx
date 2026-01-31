import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlobsChartProps = MultipleTimeseriesChartProps;

const TotalBlobsChart: FC<TotalBlobsChartProps> = React.memo(function ({
  datasets,
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Blobs"
      metricInfo={{
        xAxis: { type: "time" },
        yAxis: { type: "count" },
      }}
      options={{
        dataset: datasets,
        series: datasets?.map(({ id }, i) => ({
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

TotalBlobsChart.displayName = "TotalBlobsChart";

export { TotalBlobsChart };
