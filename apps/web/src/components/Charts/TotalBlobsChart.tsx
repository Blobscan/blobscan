import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlobsChartProps = MultipleTimeseriesChartProps;

const TotalBlobsChart: FC<TotalBlobsChartProps> = React.memo(function ({
  datasets,
  loadingOpts,
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Blobs"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "count",
        },
      }}
      dataset={datasets}
      series={datasets?.map(({ id }, i) => ({
        datasetIndex: i,
        datasetId: id,
        id: id,
        type: "bar" as const,
        stack: "total",
        encode: {
          x: "timestamp",
          y: "totalBlobs",
        },
      }))}
      options={{
        tooltip: {
          displayTotal: true,
        },
        loading: {
          timeFrame: loadingOpts?.timeFrame,
          chartType: "bar",
        },
      }}
      {...restProps}
    />
  );
});

TotalBlobsChart.displayName = "TotalBlobsChart";

export { TotalBlobsChart };
