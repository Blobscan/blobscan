import { createTimeseriesChart } from "./factories";

export const TotalBlobGasUsedChart = createTimeseriesChart({
  baseProps: {
    description:
      "The total blob gas used in each period. Blob gas is separate from execution gas.",
    title: "Total Blob Gas Used",
    yAxis: { type: "count" },
    timeseries: [
      {
        type: "bar",
        metric: "totalBlobGasUsed",
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
  requiredMetrics: ["totalBlobGasUsed"],
  componentName: "TotalBlobGasUsedChart",
});
