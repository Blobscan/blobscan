import type { EChartOption } from "echarts";

import type { MetricInfo } from "../types";
import { formatMetricValue } from "./formatters";

export function createXAxisOptions(
  metricInfo: MetricInfo,
  compact?: boolean,
  opts?: EChartOption["xAxis"]
) {
  const { type } = metricInfo;
  const axisType: EChartOption.BasicComponents.CartesianAxis.Type =
    type === "time" ? "category" : "value";
  const formatter = (value: string | number | Date) =>
    formatMetricValue(value, metricInfo, true);

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
  metricInfo: MetricInfo,
  compact?: boolean,
  opts?: EChartOption["yAxis"]
) {
  const axisType: EChartOption.BasicComponents.CartesianAxis.Type =
    metricInfo.type === "time" ? "category" : "value";
  const formatter = (value: string | number | Date) =>
    formatMetricValue(value, metricInfo, true);

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
