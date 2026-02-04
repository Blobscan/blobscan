import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type AvgBlobBaseFeeChartProps = SingleTimeseriesChartProps;

const AvgBlobBaseFeeChartInner: React.FC<AvgBlobBaseFeeChartProps> = function ({
  dataset,
  skeletonOpts = {},
  ...restProps
}) {
  return (
    <ChartCard
      title="Avg. Blob Base Fee"
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
                name: "Avg. Blob Base Fee",
                type: "line",
                encode: {
                  x: "timestamp",
                  y: "avgBlobFee",
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

export const AvgBlobBaseFeeChart = defineTimeseriesChart(
  AvgBlobBaseFeeChartInner,
  ["avgBlobFee"],
  "AvgBlobBaseFeeChart"
);
