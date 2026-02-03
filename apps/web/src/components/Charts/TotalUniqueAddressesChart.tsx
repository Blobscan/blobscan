import React from "react";
import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type TotalUniqueAddressesChartProps = SingleTimeseriesChartProps;

const TotalUniqueAddressesChart: FC<TotalUniqueAddressesChartProps> =
  React.memo(function ({ dataset, loadingOpts, ...restProps }) {
    return (
      <ChartCard
        title="Total Unique Addresses"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        dataset={dataset}
        series={
          dataset
            ? [
                {
                  name: "Total Unique Receivers",
                  type: "bar",
                  encode: {
                    x: "timestamp",
                    y: "totalUniqueReceivers",
                  },
                },
                {
                  name: "Total Unique Senders",
                  type: "bar",
                  encode: {
                    x: "timestamp",
                    y: "totalUniqueSenders",
                  },
                },
              ]
            : undefined
        }
        options={{
          loading: {
            chartType: "bar",
            timeFrame: loadingOpts?.timeFrame,
          },
        }}
        {...restProps}
      />
    );
  });

TotalUniqueAddressesChart.displayName = "TotalUniqueAddressesChart";

export { TotalUniqueAddressesChart };
