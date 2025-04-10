import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyUniqueAddressesChartProps = TimeSeriesBaseProps<{
  totalUniqueSenders: number[];
  totalUniqueReceivers: number[];
}>;

export const DailyUniqueAddressesChart: FC<DailyUniqueAddressesChartProps> =
  function ({ days, series }) {
    return (
      <ChartCard
        title="Daily Unique Addresses"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count", unitType: "none" },
        }}
        options={{
          xAxis: {
            data: days,
          },
          series: series
            ? [
                {
                  name: "Total Unique Receivers",
                  data: series.totalUniqueReceivers,
                  type: "bar",
                },
                {
                  name: "Total Unique Senders",
                  data: series.totalUniqueSenders,
                  type: "bar",
                },
              ]
            : [],
        }}
      />
    );
  };
