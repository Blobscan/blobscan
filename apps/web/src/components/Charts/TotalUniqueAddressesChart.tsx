import React from "react";
import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type TotalUniqueAddressesChartProps = SingleTimeseriesChartProps;

const TotalUniqueAddressesChart: FC<TotalUniqueAddressesChartProps> =
  React.memo(function ({ dataset, ...restProps }) {
    return (
      <ChartCard
        title="Total Unique Addresses"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        options={{
          dataset,
          series: dataset
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
            : undefined,
        }}
        {...restProps}
      />
    );
  });

TotalUniqueAddressesChart.displayName = "TotalUniqueAddressesChart";

export { TotalUniqueAddressesChart };
