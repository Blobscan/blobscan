import type { EChartOption } from "echarts";

import type { Axis } from "../types";
import { formatAxisValue } from "./formatters";

export function createXAxisOptions(
  metricInfo: Axis,
  compact?: boolean,
  opts?: EChartOption["xAxis"]
) {
  const { type } = metricInfo;
  const axisType: EChartOption.BasicComponents.CartesianAxis.Type =
    type === "time" ? "category" : "value";
  const formatter = (value: string | number | Date) =>
    formatAxisValue(value, metricInfo, true);

  return {
    type: axisType,
    axisLabel: {
      formatter,
    },
    boundaryGap: true,
    axisTick: {
      alignWithLabel: true,
    },
    ...(compact
      ? {
          axisLine: { show: false },
        }
      : {}),
    ...(opts || {}),
  };
}

export function createYAxisOptions(
  metricInfo: Axis,
  compact?: boolean,
  opts?: EChartOption["yAxis"]
) {
  const axisType: EChartOption.BasicComponents.CartesianAxis.Type =
    metricInfo.type === "time" ? "category" : "value";
  const formatter = (value: string | number | Date) =>
    formatAxisValue(value, metricInfo, true);

  return {
    type: axisType,
    axisLabel: {
      formatter,
    },
    splitLine: { show: false },
    axisLine: { show: !compact },
    ...(opts || {}),
  };
}
