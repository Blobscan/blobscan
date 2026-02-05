import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalBlobGasUsedChart = createTimeseriesChart({
  baseProps: {
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
