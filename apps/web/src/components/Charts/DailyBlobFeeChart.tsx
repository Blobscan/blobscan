import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type DailyBlobFeeChartProps = MultipleTimeseriesChartProps;

const DailyBlobFeeChart: FC<DailyBlobFeeChartProps> = React.memo(function ({
  datasets,
  ...restProps
}) {
  return (
    <ChartCard
      title="Daily Blob Fees"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "count",
          unitType: "ether",
          unit: "wei",
          displayUnit: "ether",
        },
      }}
      options={{
        dataset: datasets,
        series: datasets?.map(({ id }, i) => ({
          datasetIndex: i,
          datasetId: id,
          id,
          type: "bar",
          stack: "total",
          encode: {
            x: "timestamp",
            y: "blobFee",
          },
        })),
        dataZoom: [
          {
            show: true,
            realtime: true,
          },
          {
            type: "inside",
            realtime: true,
          },
        ],
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
