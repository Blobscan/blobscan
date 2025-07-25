import type { FC } from "react";
import React, { useMemo } from "react";
import type { EChartOption } from "echarts";
import { useTheme } from "next-themes";

import { ChartCard } from "~/components/Cards/ChartCard";
import echarts from "~/echarts";
import type { CustomTimeSeriesProps } from "./ChartBase/types";
import { aggregateSeries } from "./helpers";

export type DailyBlobGasComparisonChartProps = CustomTimeSeriesProps<{
  totalBlobAsCalldataGasUsed: {
    name?: string;
    values: string[];
  }[];
  totalBlobGasUsed: {
    name?: string;
    values: string[];
  }[];
}>;

const DailyBlobGasComparisonChart: FC<DailyBlobGasComparisonChartProps> =
  React.memo(function ({ days, series: seriesProps, ...restProps }) {
    const { resolvedTheme } = useTheme();
    const { totalBlobAsCalldataGasUsed, totalBlobGasUsed } = useMemo(() => {
      return {
        totalBlobAsCalldataGasUsed: seriesProps?.totalBlobAsCalldataGasUsed
          ? aggregateSeries(seriesProps.totalBlobAsCalldataGasUsed, "count")
          : undefined,
        totalBlobGasUsed: seriesProps?.totalBlobGasUsed
          ? aggregateSeries(seriesProps.totalBlobGasUsed, "count")
          : undefined,
      };
    }, [seriesProps]);
    const series: EChartOption.Series[] | undefined =
      totalBlobAsCalldataGasUsed && totalBlobGasUsed ? [] : undefined;

    if (series && totalBlobAsCalldataGasUsed?.length) {
      series.push({
        name: "Equivalents Blob As Calldata Gas",
        data: totalBlobAsCalldataGasUsed,
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
      });
    }

    if (series && totalBlobGasUsed?.length) {
      series.push({
        name: "Blob Gas Used",
        data: totalBlobGasUsed,
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
      });
    }

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
          series,
        }}
        {...restProps}
      />
    );
  });

DailyBlobGasComparisonChart.displayName = "DailyBlobGasComparisonChart";

export { DailyBlobGasComparisonChart };
