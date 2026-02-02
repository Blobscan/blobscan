import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type AvgBlobGasPriceChartProps = SingleTimeseriesChartProps;

const AvgBlobGasPriceChart: FC<AvgBlobGasPriceChartProps> = React.memo(
  function ({ dataset, ...restProps }) {
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
        {...restProps}
      />
    );
  }
);

AvgBlobGasPriceChart.displayName = "AvgBlobGasPriceChart";

export { AvgBlobGasPriceChart };
