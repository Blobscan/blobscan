import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalBlobBaseFeeChartProps = MultipleTimeseriesChartProps;

const TotalBlobBaseFeesInner: FC<TotalBlobBaseFeeChartProps> = function ({
  dataset,
  skeletonOpts = {},
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Blob Base Fees"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "count",
          unitType: "ether",
          unit: "wei",
          displayUnit: "Gwei",
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
          y: "totalBlobFee",
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

export const TotalBlobBaseFeesChart = defineTimeseriesChart(
  TotalBlobBaseFeesInner,
  ["totalBlobFee"],
  "TotalBlobBaseFeesChart"
);
