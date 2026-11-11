import { createTimeseriesChart } from "./factories";

export const TotalBlobsChart = createTimeseriesChart({
  baseProps: {
    description:
      "The number of blobs in each period. Repeated blobs are counted each time they appear.",
    title: "Total Blobs",
    yAxis: {
      type: "count",
    },
    timeseries: [
      {
        type: "bar",
        metric: "totalBlobs",
        stack: "total",
      },
    ],
    skeletonOpts: {
      chart: {
        variant: "bar",
      },
    },
    tooltipOpts: {
      displayTotal: true,
    },
  },
  requiredMetrics: ["totalBlobs"],
  componentName: "TotalBlobsChart",
});
