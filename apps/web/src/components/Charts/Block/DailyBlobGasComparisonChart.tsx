import type { FC } from "react";
import * as echarts from "echarts";
import { useTheme } from "next-themes";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TimeSeriesBaseProps } from "../ChartBase";

export type DailyBlobGasComparisonChartProps = TimeSeriesBaseProps<{
  totalBlobAsCalldataGasUsed: string[];
  totalBlobGasUsed: string[];
}>;

export const DailyBlobGasComparisonChart: FC<DailyBlobGasComparisonChartProps> =
  function ({ days, series }) {
    const { resolvedTheme } = useTheme();

    return (
      <ChartCard
        title="Daily Blob Gas Expenditure Comparison"
        metricInfo={{
          xAxis: {
            type: "time",
          },
          yAxis: { type: "count", unitType: "none" },
        }}
        options={{
          xAxis: {
            data: days,
          },
          series: series
            ? [
                {
                  name: "Blob Gas Used",
                  data: series.totalBlobGasUsed,
                  stack: "gas",
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
                },
                {
                  name: "Equivalent Blob As Calldata Gas",
                  data: series.totalBlobAsCalldataGasUsed,
                  stack: "gas",
                  type: "bar",
                  itemStyle: {
                    color: resolvedTheme === "dark" ? "#9c3932" : "#e97979",
                  },
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
                },
              ]
            : [],
        }}
      />
    );
  };
