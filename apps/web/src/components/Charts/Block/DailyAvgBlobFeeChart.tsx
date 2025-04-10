import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyAvgBlobFeeChartProps = TimeSeriesBaseProps<number[]>;

export const DailyAvgBlobFeeChart: FC<DailyAvgBlobFeeChartProps> = function ({
  days,
  series,
}) {
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
        series: scaledValues
          ? [
              {
                name: "Avg. Blob Fee",
                data: scaledValues,
                type: "line",
              },
            ]
          : undefined,
      }}
    />
  );
};
