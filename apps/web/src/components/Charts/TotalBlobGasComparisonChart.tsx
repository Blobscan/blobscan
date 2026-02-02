import type { FC } from "react";
import React from "react";
import { useTheme } from "next-themes";

import { ChartCard } from "~/components/Cards/ChartCard";
import echarts from "~/echarts";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type TotalBlobGasComparisonChartProps = SingleTimeseriesChartProps;

const TotalBlobGasComparisonChart: FC<TotalBlobGasComparisonChartProps> =
  React.memo(function ({ dataset, ...restProps }) {
    const { resolvedTheme } = useTheme();

    return (
      <ChartCard
        title="Total Blob Gas Expenditure Comparison"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        dataset={dataset}
        series={
          dataset
            ? [
                {
                  name: "Total Blob Gas Used",
                  type: "line",
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      {
                        offset: 0,
                        color: "rgba(58,77,233,0.8)",
                      },
                      {
                        offset: 1,
                        color: "rgba(58,77,233,0.3)",
                      },
                    ]),
                  },
                  encode: {
                    x: "timestamp",
                    y: "totalBlobGasUsed",
                  },
                },
                {
                  type: "line",
                  itemStyle: {
                    color: resolvedTheme === "dark" ? "#9c3932" : "#e97979",
                  },
                  name: "Total Blob Gas Used as Calldata",
                  areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                      {
                        offset: 0,
                        color: "rgba(213,72,120,0.8)",
                      },
                      {
                        offset: 1,
                        color: "rgba(222, 70, 121, 0.514)",
                      },
                    ]),
                  },
                  encode: {
                    x: "timestamp",
                    y: "totalBlobAsCalldataGasUsed",
                  },
                },
              ]
            : undefined
        }
        {...restProps}
      />
    );
  });

TotalBlobGasComparisonChart.displayName = "TotalBlobGasComparisonChart";

export { TotalBlobGasComparisonChart as TotalBlobGasComparisonChart };
