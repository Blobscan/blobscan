import { createTimeseriesChart } from "./factories";

export const TotalBlobSizeChart = createTimeseriesChart({
  baseProps: {
    description:
      "The total size of blobs in each period, including padding bytes.",
    title: "Total Blob Size",
    yAxis: {
      type: "count",
      unitType: "byte",
      unit: "B",
      displayUnit: "GiB",
    },
    timeseries: [
      {
        type: "bar",
        metric: "totalBlobSize",
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
  requiredMetrics: ["totalBlobSize"],
  componentName: "TotalBlobSizeChart",
});
