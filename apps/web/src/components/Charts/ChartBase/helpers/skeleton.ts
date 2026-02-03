import type { EChartOption } from "echarts";

import type { TimeFrame } from "@blobscan/api";

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

const SKELETON_DATA_POINTS_ALL = generateSkeletonData(720);
const SKELETON_DATA_POINTS_7D = generateSkeletonData(7);
const SKELETON_DATA_POINTS_15D = generateSkeletonData(15);
const SKELETON_DATA_POINTS_30D = generateSkeletonData(30);
const SKELETON_DATA_POINTS_90D = generateSkeletonData(90);
const SKELETON_DATA_POINTS_180D = generateSkeletonData(180);
const SKELETON_DATA_POINTS_365D = generateSkeletonData(365);

export function getSkeletonDataPoints(timeFrame: TimeFrame) {
  switch (timeFrame) {
    case "All":
      return SKELETON_DATA_POINTS_ALL;
    case "7d":
      return SKELETON_DATA_POINTS_7D;
    case "30d":
      return SKELETON_DATA_POINTS_30D;
    case "90d":
      return SKELETON_DATA_POINTS_90D;
    case "180d":
      return SKELETON_DATA_POINTS_180D;
    case "365d":
      return SKELETON_DATA_POINTS_365D;
    case "15d":
      return SKELETON_DATA_POINTS_15D;
    default:
      return SKELETON_DATA_POINTS_30D;
  }
}

export function createChartSkeletonOptions({
  compact,
  timeFrame = "30d",
  chartType = "bar",
}: {
  compact?: boolean;
  timeFrame?: TimeFrame;
  chartType?: "line" | "bar";
}) {
  const dataPoints = getSkeletonDataPoints(timeFrame);

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
        type: chartType,
        data: dataPoints,
        symbol: "none",
        smooth: true,
        silent: true,

        itemStyle: {
          color: "#E5E7EB",
          opacity: 0.1,
        },
        lineStyle: {
          color: "#E5E7EB",
          type: "solid",
          opacity: 0.1,
        },
        areaStyle: {
          opacity: 0.1,
        },
      },
    ],
    xAxis: {
      data: Array.from({ length: dataPoints.length }, (_, i) => i),
      axisLabel: { show: false },
      axisLine: {
        show: false,
        lineStyle: { color: "#E5E7EB" },
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
        lineStyle: { color: "#E5E7EB", opacity: 0.1 },
      },
      splitLine: {
        show: false,
      },
      show: !compact,
    },
  } satisfies EChartOption;
}
