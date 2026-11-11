import { createTimeseriesChart } from "./factories";

export const TotalBlobUsageSizeChart = createTimeseriesChart({
  baseProps: {
    description:
      "The total size of blob data in each period after trailing zero bytes are removed.",
    title: "Total Blob Usage",
    yAxis: {
      type: "count",
      unitType: "byte",
      unit: "B",
      displayUnit: "GiB",
    },
    timeseries: [
      {
        type: "bar",
        metric: "totalBlobUsageSize",
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
  requiredMetrics: ["totalBlobUsageSize"],
  componentName: "TotalBlobUsageSizeChart",
});
