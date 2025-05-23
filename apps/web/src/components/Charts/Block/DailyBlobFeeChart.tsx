import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { TimeSeriesProps } from "../ChartBase/types";

export type DailyBlobFeeChartProps = TimeSeriesProps<string>;

const DailyBlobFeeChart: FC<DailyBlobFeeChartProps> = React.memo(function ({
  days,
  series,
  ...restProps
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
      {...restProps}
    />
  );
});

DailyBlobFeeChart.displayName = "DailyBlobFeeChart";

export { DailyBlobFeeChart };
