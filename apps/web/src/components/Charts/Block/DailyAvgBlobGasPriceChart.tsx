import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyAvgBlobGasPriceChartProps = TimeSeriesBaseProps<number[]>;

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
          yAxis: { type: "average", unitType: "ether", unit },
        }}
        options={{
          xAxis: {
            data: days,
          },
          series: series
            ? [
                {
                  name: "Avg. Blob Gas Price",
                  data: scaledValues,
                  type: "line",
                },
              ]
            : undefined,
        }}
        {...restProps}
      />
    );
  };
