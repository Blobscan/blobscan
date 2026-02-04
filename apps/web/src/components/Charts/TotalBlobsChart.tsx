import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalBlobsChartProps = MultipleTimeseriesChartProps;

const TotalBlobsChartInner: FC<TotalBlobsChartProps> = function ({
  dataset,
  skeletonOpts = {},
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
      dataset={dataset}
      series={dataset?.map(({ id }, i) => ({
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
      skeletonOpts={{
        ...skeletonOpts,
        chart: {
          variant: "bar",
          ...skeletonOpts?.chart,
        },
      }}
      tooltipOpts={{
        displayTotal: true,
      }}
      {...restProps}
    />
  );
};

export const TotalBlobsChart = defineTimeseriesChart(
  TotalBlobsChartInner,
  ["totalBlobs"],
  "TotalBlobsChart"
);
