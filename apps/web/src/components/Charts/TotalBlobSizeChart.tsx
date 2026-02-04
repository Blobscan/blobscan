import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalBlobsSizeProps = MultipleTimeseriesChartProps;

const TotalBlobSizeChartInner: FC<TotalBlobsSizeProps> = function ({
  dataset,
  skeletonOpts = {},
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Blob Size"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "count",
          unitType: "byte",
          unit: "B",
          displayUnit: "GiB",
        },
      }}
      dataset={dataset}
      series={dataset?.map(({ id }, i) => ({
        datasetIndex: i,
        datasetId: id,
        id,
        type: "bar",
        stack: "total",
        encode: {
          x: "timestamp",
          y: "totalBlobSize",
        },
      }))}
      skeletonOpts={{
        ...skeletonOpts,
        chart: {
          ...(skeletonOpts?.chart ?? {}),
          variant: "bar",
        },
      }}
      tooltipOpts={{
        displayTotal: true,
      }}
      {...restProps}
    />
  );
};

export const TotalBlobSizeChart = defineTimeseriesChart(
  TotalBlobSizeChartInner,
  ["totalBlobSize"],
  "TotalBlobSizeChart"
);
