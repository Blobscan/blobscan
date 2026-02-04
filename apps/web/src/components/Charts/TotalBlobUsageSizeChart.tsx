import type { FC } from "react";
import React from "react";

import { ChartCard } from "../Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalBlobUsageSizeChartProps = MultipleTimeseriesChartProps;

const TotalBlobUsageSizeChartInner: FC<TotalBlobUsageSizeChartProps> =
  function ({ dataset, skeletonOpts = {}, ...restProps }) {
    return (
      <ChartCard
        title="Total Blob Usage"
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
            y: "totalBlobUsageSize",
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

export const TotalBlobUsageSizeChart = defineTimeseriesChart(
  TotalBlobUsageSizeChartInner,
  ["totalBlobUsageSize"],
  "TotalBlobUsageSizeChart"
);
