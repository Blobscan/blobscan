import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalBlocksChart = createTimeseriesChart({
  baseProps: {
    title: "Total Blocks",
    yAxis: { type: "count" },
    timeseries: [
      {
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
    tooltipOpts: {
      displayTotal: true,
    },
  },
  requiredMetrics: ["totalBlocks"],
  componentName: "TotalBlocksChart",
});
