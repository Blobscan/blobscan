import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type DailyAvgBlobGasPriceChartProps = SingleTimeseriesChartProps;

const DailyAvgBlobGasPriceChart: FC<DailyAvgBlobGasPriceChartProps> =
  React.memo(function ({ dataset, ...restProps }) {
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
        options={{
          dataset,
          series: dataset
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
            : undefined,
        }}
        {...restProps}
      />
    );
  });

DailyAvgBlobGasPriceChart.displayName = "DailyAvgBlobGasPriceChart";

export { DailyAvgBlobGasPriceChart };
