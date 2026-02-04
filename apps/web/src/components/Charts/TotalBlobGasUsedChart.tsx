import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalBlobGasUsedChartProps = MultipleTimeseriesChartProps;

const TotalBlobGasUsedChartInner: FC<TotalBlobGasUsedChartProps> = function ({
  dataset,
  skeletonOpts = {},
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Blob Gas Used"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: { type: "count" },
      }}
      dataset={dataset}
      series={dataset?.map(({ id }, i) => ({
        datasetIndex: i,
        datasetId: id,
        id: id,
        type: "bar",
        stack: "total",
        encode: {
          x: "timestamp",
          y: "totalBlobGasUsed",
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

export const TotalBlobGasUsedChart = defineTimeseriesChart(
  TotalBlobGasUsedChartInner,
  ["totalBlobGasUsed"],
  "TotalBlobGasUsedChart"
);
