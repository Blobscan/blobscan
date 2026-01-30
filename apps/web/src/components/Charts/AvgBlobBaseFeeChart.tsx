import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type AvgBlobFeeChartProps = SingleTimeseriesChartProps;

const AvgBlobBaseFeeChart: FC<AvgBlobFeeChartProps> = React.memo(function ({
  dataset,
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
      options={{
        dataset: dataset,
        series: dataset
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
          : undefined,
      }}
      {...restProps}
    />
  );
});

AvgBlobBaseFeeChart.displayName = "AvgBlobBaseFeeChart";

export { AvgBlobBaseFeeChart };
