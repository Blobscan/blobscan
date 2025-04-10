import type { FC } from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyBlobFeeChartProps = TimeSeriesBaseProps<
  {
    name?: string;
    values: string[];
  }[]
>;

export const DailyBlobFeeChart: FC<DailyBlobFeeChartProps> = function ({
  days,
  series,
}) {
  const { scaledValues, unit } = useScaledWeiAmounts(series);

  return (
    <ChartCard
      title="Daily Blob Fees"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: { type: "count", unitType: "ether", unit },
      }}
      options={{
        xAxis: {
          data: days,
        },
        series: scaledValues?.map(({ name, values }) => ({
          name,
          data: values,
          type: "bar",
          stack: "total",
        })),
        tooltipExtraOptions: {
          displayTotal: true,
        },
      }}
    />
  );
};
