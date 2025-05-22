import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesProps } from "../ChartBase/types";

export type DailyAvgBlobGasPriceChartProps = TimeSeriesProps<number>;

export const DailyAvgBlobGasPriceChart: FC<DailyAvgBlobGasPriceChartProps> =
  function ({ days, series, ...restProps }) {
    const { scaledValues, unit } = useScaledWeiAmounts(series);

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
  };
