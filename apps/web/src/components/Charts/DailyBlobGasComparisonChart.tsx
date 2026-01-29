import type { FC } from "react";
import React from "react";
import { useTheme } from "next-themes";

import { ChartCard } from "~/components/Cards/ChartCard";
import echarts from "~/echarts";
import type { SingleTimeseriesChartProps } from "./ChartBase/types";

export type DailyBlobGasComparisonChartProps = SingleTimeseriesChartProps;

const DailyBlobGasComparisonChart: FC<DailyBlobGasComparisonChartProps> =
  React.memo(function ({ dataset, ...restProps }) {
    const { resolvedTheme } = useTheme();
    // const totalBlobAsCalldataGasUsedSeries = datasets?.find(
    //   ({ id }) => id === "totalBlobAsCalldataGasUsed"
    // );
    // const series: EChartOption.Series[] | undefined =
    //   totalBlobAsCalldataGasUsed && totalBlobGasUsed ? [] : undefined;

    // if (series && totalBlobAsCalldataGasUsed?.length) {
    //   series.push({
    //     name: "Equivalents Blob As Calldata Gas",
    //     data: totalBlobAsCalldataGasUsed,
    //     stack: "gas",
    //     type: "bar",
    //     itemStyle: {
    //       color: resolvedTheme === "dark" ? "#9c3932" : "#e97979",
    //     },
    //     areaStyle: {
    //       color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    //         {
    //           offset: 0,
    //           color: "rgba(213,72,120,0.8)",
    //         },
    //         {
    //           offset: 1,
    //           color: "rgba(222, 70, 121, 0.514)",
    //         },
    //       ]),
    //     },
    //   });
    // }

    // if (series && totalBlobGasUsed?.length) {
    //   series.push({
    //     name: "Blob Gas Used",
    //     data: totalBlobGasUsed,
    //     stack: "gas",
    //     type: "bar",
    //     areaStyle: {
    //       color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
    //         {
    //           offset: 0,
    //           color: "rgba(58,77,233,0.8)",
    //         },
    //         {
    //           offset: 1,
    //           color: "rgba(58,77,233,0.3)",
    //         },
    //       ]),
    //     },
    //   });
    // }

    return (
      <ChartCard
        title="Daily Blob Gas Expenditure Comparison"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count" },
        }}
        options={{
          dataset,
          series: dataset
            ? [
                {
                  name: "Total Blob Gas Used",
                  type: "bar",
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
                  type: "bar",
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
            : undefined,
        }}
        {...restProps}
      />
    );
  });

DailyBlobGasComparisonChart.displayName = "DailyBlobGasComparisonChart";

export { DailyBlobGasComparisonChart };
