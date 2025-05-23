import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesProps } from "../ChartBase/types";

export type DailyAvgBlobFeeChartProps = TimeSeriesProps<number>;

const DailyAvgBlobFeeChart: FC<DailyAvgBlobFeeChartProps> = React.memo(
  function ({ days, series, ...restProps }) {
    const { scaledValues, unit } = useScaledWeiAmounts(series);

    return (
      <ChartCard
        title={"Daily Avg. Blob Fee"}
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
            name: name === "total" ? "Avg. Blob Fee" : name,
            data: values,
            type: "line",
          })),
        }}
        {...restProps}
      />
    );
  }
);

DailyAvgBlobFeeChart.displayName = "DailyAvgBlobFeeChart";

export { DailyAvgBlobFeeChart };
