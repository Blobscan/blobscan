import type { XAxisComponentOption, YAxisComponentOption } from "echarts";

import type { Axis } from "../types";
import { formatAxisValue } from "./formatters";

export function createXAxisOptions(
  metricInfo: Axis,
  compact?: boolean,
  opts?: XAxisComponentOption
) {
  const { type } = metricInfo;
  const axisType: "category" | "value" = type === "time" ? "category" : "value";
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
  } as XAxisComponentOption;
}

export function createYAxisOptions(
  metricInfo: Axis,
  compact?: boolean,
  opts?: YAxisComponentOption
) {
  const axisType: "category" | "value" =
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
  } as YAxisComponentOption;
}
