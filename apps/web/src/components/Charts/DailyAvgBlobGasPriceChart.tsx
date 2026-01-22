import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesProps } from "./ChartBase/types";

export type DailyAvgBlobGasPriceChartProps = TimeSeriesProps<number>;

const DailyAvgBlobGasPriceChart: FC<DailyAvgBlobGasPriceChartProps> =
  React.memo(function ({ days, series, ...restProps }) {
    const { scaledValues, unit } = useScaledWeiAmounts(series, "Gwei");

    return (
      <ChartCard
        title="Daily Avg. Blob Gas Price"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "average", unitType: "ether", unit: unit },
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

DailyAvgBlobGasPriceChart.displayName = "DailyAvgBlobGasPriceChart";

export { DailyAvgBlobGasPriceChart };
