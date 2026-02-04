import React from "react";
import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalUniqueAddressesChartProps = SingleTimeseriesChartProps;

const TotalUniqueAddressesChartInner: FC<TotalUniqueAddressesChartProps> =
  function ({ dataset, skeletonOpts = {}, ...restProps }) {
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
        skeletonOpts={{
          ...skeletonOpts,
          chart: {
            ...(skeletonOpts?.chart ?? {}),
            variant: "bar",
          },
          legend: {
            ...(skeletonOpts?.legend ?? {}),
            itemCount: 2,
          },
        }}
        {...restProps}
      />
    );
  };

export const TotalUniqueAddressesChart = defineTimeseriesChart(
  TotalUniqueAddressesChartInner,
  ["totalUniqueReceivers", "totalUniqueSenders"],
  "TotalUniqueAddressesChart"
);
