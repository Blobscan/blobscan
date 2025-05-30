import React, { useMemo } from "react";
import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { CustomTimeSeriesProps } from "./ChartBase/types";
import { aggregateSeries } from "./helpers";

export type DailyUniqueAddressesChartProps = CustomTimeSeriesProps<{
  totalUniqueReceivers: {
    name?: string;
    values: number[];
  }[];
  totalUniqueSenders: {
    name?: string;
    values: number[];
  }[];
}>;

const DailyUniqueAddressesChart: FC<DailyUniqueAddressesChartProps> =
  React.memo(function ({ days, series: seriesProps, ...restProps }) {
    const { totalUniqueReceivers, totalUniqueSenders } = useMemo(
      () => ({
        totalUniqueReceivers: seriesProps?.totalUniqueReceivers
          ? aggregateSeries(seriesProps.totalUniqueReceivers, "count")
          : undefined,
        totalUniqueSenders: seriesProps?.totalUniqueSenders
          ? aggregateSeries(seriesProps.totalUniqueSenders, "count")
          : undefined,
      }),
      [seriesProps]
    );
    const series: echarts.EChartOption.Series[] | undefined =
      totalUniqueReceivers && totalUniqueSenders ? [] : undefined;

    if (series && totalUniqueReceivers?.length) {
      series.push({
        name: "Total Unique Receivers",
        data: totalUniqueReceivers,
        type: "bar",
      });
    }

    if (series && totalUniqueSenders?.length) {
      series.push({
        name: "Total Unique Senders",
        data: totalUniqueSenders,
        type: "bar",
      });
    }

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
          series,
        }}
        {...restProps}
      />
    );
  });

DailyUniqueAddressesChart.displayName = "DailyUniqueAddressesChart";

export { DailyUniqueAddressesChart };
