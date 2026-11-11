import type {
  DatasetComponentOption,
  XAxisComponentOption,
  YAxisComponentOption,
} from "echarts";

import type { Axis } from "../types";
import type { ChartSeries } from "./current-period";
import { getSeriesMetricValue, isColumnSource } from "./current-period";
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
    scale: metricInfo.scale ?? false,
    ...(opts || {}),
  } as YAxisComponentOption;
}

export function createEndpointXAxisOptions(
  metricInfo: Axis,
  pointCount: number
) {
  const options = createXAxisOptions(metricInfo, true);

  return {
    ...options,
    axisTick: { show: false },
    axisLabel: {
      ...options.axisLabel,
      interval: Math.max(0, pointCount - 2),
      showMinLabel: true,
      showMaxLabel: true,
    },
  } as XAxisComponentOption;
}

/** Returns a zero baseline and one rounded upper limit for a summary chart. */
export function getEndpointAxisScale(max: number) {
  const magnitude =
    max > 0 && Number.isFinite(max) ? 10 ** Math.floor(Math.log10(max)) : 1;
  const normalized = max / magnitude;
  const step = [1, 2, 5, 10].find((value) => value >= normalized) ?? 1;
  const upperLimit = step * magnitude;

  return { min: 0, max: upperLimit, interval: upperLimit };
}

/**
 * Returns the largest value of the left y-axis: the largest sum of the series
 * of a stack, or the largest value of a series that is not stacked.
 */
export function getLeftAxisMax(
  series: ChartSeries[],
  datasets: DatasetComponentOption | DatasetComponentOption[]
): number {
  const firstDataset = Array.isArray(datasets) ? datasets[0] : datasets;
  const rows = isColumnSource(firstDataset?.source)
    ? firstDataset.source.timestamp.length
    : 0;
  let max = 0;

  for (let i = 0; i < rows; i++) {
    const sums = new Map<string, number>();

    series.forEach((s, seriesIndex) => {
      if ((s.yAxisIndex ?? 0) !== 0) {
        return;
      }

      const value = Number(getSeriesMetricValue(s, datasets, i) ?? 0);
      const key = s.stack ?? `series-${seriesIndex}`;

      if (Number.isFinite(value)) {
        sums.set(key, (sums.get(key) ?? 0) + value);
      }
    });

    sums.forEach((sum) => {
      max = Math.max(max, sum);
    });
  }

  return max;
}

/**
 * Returns a tick interval that is a power of 2, for example 256 KiB or 1 MiB,
 * that divides `max` into about `ticks` parts, and the axis max, which is the
 * next tick. Decimal intervals give byte labels such as "292.9 KiB". Returns
 * undefined when `max` is not positive.
 */
export function getBinaryAxisScale(
  max: number,
  ticks = 5
): { interval: number; max: number } | undefined {
  if (!(max > 0)) {
    return;
  }

  const interval = 2 ** Math.ceil(Math.log2(max / ticks));

  return { interval, max: Math.ceil(max / interval) * interval };
}
