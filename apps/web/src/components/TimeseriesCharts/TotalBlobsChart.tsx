import { createTimeseriesChart } from "./factories";

export const TotalBlobsChart = createTimeseriesChart({
  baseProps: {
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
