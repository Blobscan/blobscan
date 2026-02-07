import type { EChartOption } from "echarts";

import type { SkeletonOptions } from "..";

export interface SkeletonChartOptions {
  itemCount?: 7 | 15 | 30 | 90 | 180 | 365 | 720;
  variant?: "line" | "bar";
}

const hash = (n: number) => {
  const x = Math.sin(n) * 10000;
  return x - Math.floor(x);
};

function generateSkeletonData(length = 20): number[] {
  const rawData: number[] = [];

  for (let i = 0; i < length; i++) {
    const trend = (i / length) * 50;
    const noise = hash(i) * 60;
    const cliff = hash(i * 0.1) > 0.8 ? hash(i) * 20 : 0;

    rawData.push(trend + noise + cliff);
  }

  const smoothedData = rawData.map((val, i, arr) => {
    const windowSize = 3;
    const start = Math.max(0, i - windowSize);
    const end = Math.min(arr.length, i + windowSize);
    const subset = arr.slice(start, end);
    const sum = subset.reduce((a, b) => a + b, 0);
    return Number((sum / subset.length).toFixed(2));
  });

  return smoothedData;
}

const SKELETON_DATA_POINTS_7 = generateSkeletonData(7);
const SKELETON_DATA_POINTS_15 = generateSkeletonData(15);
const SKELETON_DATA_POINTS_30 = generateSkeletonData(30);
const SKELETON_DATA_POINTS_90 = generateSkeletonData(90);
const SKELETON_DATA_POINTS_180 = generateSkeletonData(180);
const SKELETON_DATA_POINTS_365 = generateSkeletonData(365);
const SKELETON_DATA_POINTS_720 = generateSkeletonData(720);

export function getSkeletonDataPoints(
  itemCount: SkeletonChartOptions["itemCount"]
) {
  switch (itemCount) {
    case 7:
      return SKELETON_DATA_POINTS_7;
    case 15:
      return SKELETON_DATA_POINTS_15;
    case 30:
      return SKELETON_DATA_POINTS_30;
    case 90:
      return SKELETON_DATA_POINTS_90;
    case 180:
      return SKELETON_DATA_POINTS_180;
    case 365:
      return SKELETON_DATA_POINTS_365;
    case 720:
      return SKELETON_DATA_POINTS_720;
    default:
      return SKELETON_DATA_POINTS_30;
  }
}

const SKELETON_DARK_COLOR = "#434672";
const SKELETON_LIGHT_COLOR = "#EADEFD";

export function createChartSkeletonOptions({
  compact,
  themeMode,
  variant = "bar",
  itemCount = 30,
}: {
  compact?: boolean;
  themeMode: "light" | "dark";
} & SkeletonOptions["chart"]) {
  const dataPoints = getSkeletonDataPoints(itemCount);
  const skeletonColor =
    themeMode === "dark" ? SKELETON_DARK_COLOR : SKELETON_LIGHT_COLOR;
  return {
    animation: false,
    grid: {
      top: 27,
      right: 10,
      bottom: compact ? 22 : 82,
      left: 40,
    },
    series: [
      {
        type: variant,
        data: dataPoints,
        symbol: "none",
        smooth: true,
        silent: true,

        itemStyle: {
          color: skeletonColor,
        },
        lineStyle: {
          color: skeletonColor,
          type: "solid",
        },
        areaStyle: {
          color: skeletonColor,
        },
      },
    ],
    xAxis: {
      data: Array.from({ length: itemCount }, (_, i) => i),
      axisLabel: { show: false },
      axisLine: {
        show: false,
        lineStyle: { color: skeletonColor },
      },
      axisTick: {
        show: false,
      },
      splitLine: { show: false },
      show: !compact,
    },
    yAxis: {
      axisLabel: { show: false },
      axisLine: {
        show: !compact,
        lineStyle: { color: skeletonColor },
      },
      splitLine: {
        show: false,
      },
      show: !compact,
    },
    tooltip: {
      show: false,
    },
    dataZoom: undefined,
  } satisfies EChartOption;
}
