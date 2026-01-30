import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlobsSizeProps = MultipleTimeseriesChartProps;

const TotalBlobSizeChart: FC<TotalBlobsSizeProps> = React.memo(function ({
  datasets,
  ...restProps
}) {
  return (
    <ChartCard
      title="Total Blob Size"
      metricInfo={{
        xAxis: {
          type: "time",
        },
        yAxis: {
          type: "count",
          unitType: "byte",
          unit: "B",
          displayUnit: "GiB",
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
            y: "totalBlobSize",
          },
        })),
        tooltipExtraOptions: {
          displayTotal: true,
        },
      }}
      {...restProps}
    />
  );
});

TotalBlobSizeChart.displayName = "TotalBlobSizeChart";

export { TotalBlobSizeChart };
