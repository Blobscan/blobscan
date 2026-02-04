import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";
import { defineTimeseriesChart } from "./helpers";

export type TotalTransactionsChartProps = MultipleTimeseriesChartProps;

const TotalTransactionsChartInner: FC<TotalTransactionsChartProps> = function ({
  dataset,
  skeletonOpts = {},
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Transactions"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: { type: "count" },
      }}
      dataset={dataset}
      series={dataset?.map(({ id }, i) => ({
        datasetId: id,
        datasetIndex: i,
        id,
        type: "bar",
        stack: "total",
        encode: {
          x: "timestamp",
          y: "totalTransactions",
        },
      }))}
      skeletonOpts={{
        ...skeletonOpts,
        chart: {
          ...(skeletonOpts?.chart ?? {}),
          variant: "bar",
        },
      }}
      tooltipOpts={{
        displayTotal: true,
      }}
      {...restProps}
    />
  );
};

export const TotalTransactionsChart = defineTimeseriesChart(
  TotalTransactionsChartInner,
  ["totalTransactions"],
  "TotalTransactionsChart"
);
