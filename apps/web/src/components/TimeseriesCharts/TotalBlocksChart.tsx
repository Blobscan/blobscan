import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalBlocksChart = createTimeseriesChart({
  baseProps: {
    title: "Total Blocks",
    yAxis: { type: "count" },
    timeseries: [
      {
        name: "Total Blocks",
        type: "bar",
        metric: "totalBlocks",
        stack: "total",
      },
    ],
    skeletonOpts: {
      chart: {
        variant: "bar",
      },
    },
  },
  requiredMetrics: ["totalBlocks"],
  componentName: "TotalBlocksChart",
});
