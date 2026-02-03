import type { FC } from "react";
import React from "react";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { MultipleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlobBaseFeeChartProps = MultipleTimeseriesChartProps;

const TotalBlobBaseFeesChart: FC<TotalBlobBaseFeeChartProps> = React.memo(
  function ({ datasets, loadingOpts, ...restProps }) {
    return (
      <ChartCard
        title="Total Blob Base Fees"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: {
            type: "count",
            unitType: "ether",
            unit: "wei",
            displayUnit: "Gwei",
          },
        }}
        dataset={datasets}
        series={datasets?.map(({ id }, i) => ({
          datasetIndex: i,
          datasetId: id,
          id,
          type: "bar",
          stack: "total",
          encode: {
            x: "timestamp",
            y: "totalBlobFee",
          },
        }))}
        options={{
          tooltip: {
            displayTotal: true,
          },
          loading: {
            chartType: "bar",
            timeFrame: loadingOpts?.timeFrame,
          },
        }}
        {...restProps}
      />
    );
  }
);

TotalBlobBaseFeesChart.displayName = "TotalBlobBaseFeesChart";

export { TotalBlobBaseFeesChart as TotalBlobBaseFeesChart };
