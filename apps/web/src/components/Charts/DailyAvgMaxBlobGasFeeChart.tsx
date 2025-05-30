import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesBaseProps } from "./ChartBase";

export type DailyAvgMaxBlobGasFeeChartProps = TimeSeriesBaseProps<number>;

const DailyAvgMaxBlobGasFeeChart: FC<DailyAvgMaxBlobGasFeeChartProps> =
  React.memo(function ({ days, series, ...restProps }) {
    const { scaledValues, unit } = useScaledWeiAmounts(series);

    return (
      <ChartCard
        title={"Daily Avg. Max Blob Gas Fee"}
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "average", unitType: "ether", unit },
        }}
        options={{
          xAxis: {
            data: days,
          },
          series: scaledValues?.map(({ name, values }) => ({
            name: name === "total" ? "Avg. Blob Gas Price" : name,
            data: values,
            type: "line",
          })),
        }}
        {...restProps}
      />
    );
  });

DailyAvgMaxBlobGasFeeChart.displayName = "DailyAvgMaxBlobGasFeeChart";

export { DailyAvgMaxBlobGasFeeChart };
