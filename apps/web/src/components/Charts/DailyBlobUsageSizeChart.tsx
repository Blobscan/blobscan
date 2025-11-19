import type { FC } from "react";
import React from "react";

import { formatBytes } from "~/utils";
import { ChartCard } from "../Cards/ChartCard";
import type { TimeSeriesProps } from "./ChartBase/types";

export type DailyBlobUsageSizeChartProps = TimeSeriesProps<string>;

const DailyBlobUsageSizeChart: FC<DailyBlobUsageSizeChartProps> = React.memo(
  ({ days, series, ...restProps }) => {
    const scaledSeries = series?.map(({ name, values }) => ({
      name,
      values: values.map((v) =>
        Number(
          formatBytes(v, {
            unit: "GiB",
            hideUnit: true,
            displayAllDecimals: true,
          })
        )
      ),
    }));

    return (
      <ChartCard
        title="Daily Blob Usage Size"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: {
            type: "count",
            unitType: "byte",
            unit: "GiB",
          },
        }}
        options={{
          xAxis: {
            data: days,
          },
          series: scaledSeries?.map(({ name, values }) => ({
            name,
            data: values,
            type: "bar",
            stack: "total",
          })),
          tooltipExtraOptions: {
            displayTotal: true,
          },
        }}
        {...restProps}
      />
    );
  }
);

DailyBlobUsageSizeChart.displayName = "DailyBlobUsageSizeChart";

export { DailyBlobUsageSizeChart };
