import React from "react";
import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type DailyUniqueAddressesChartProps = SingleTimeseriesChartProps;

const DailyUniqueAddressesChart: FC<DailyUniqueAddressesChartProps> =
  React.memo(function ({ dataset, ...restProps }) {
    return (
      <ChartCard
        title="Daily Unique Addresses"
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

DailyUniqueAddressesChart.displayName = "DailyUniqueAddressesChart";

export { DailyUniqueAddressesChart };
