import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type AvgBlobGasPriceChartProps = SingleTimeseriesChartProps;

const AvgBlobGasPriceInner: FC<AvgBlobGasPriceChartProps> = function ({
  dataset,
  skeletonOpts = {},
  ...restProps
}) {
  return (
    <ChartCard
      title="Avg. Blob Gas Price"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "average",
          unitType: "ether",
          unit: "wei",
          displayUnit: "Gwei",
        },
      }}
      dataset={dataset}
      series={
        dataset
          ? [
              {
                name: "Avg. Blob Gas Price",
                type: "line",
                encode: {
                  x: "timestamp",
                  y: "avgBlobGasPrice",
                },
              },
            ]
          : undefined
      }
      skeletonOpts={{
        ...skeletonOpts,
        chart: {
          ...(skeletonOpts?.chart ?? {}),
          variant: "line",
        },
        legend: {
          ...(skeletonOpts?.legend ?? {}),
          itemCount: 1,
        },
      }}
      {...restProps}
    />
  );
};

export const AvgBlobGasPriceChart = defineTimeseriesChart(
  AvgBlobGasPriceInner,
  ["avgBlobGasPrice"],
  "AvgBlobGasPriceChart"
);
