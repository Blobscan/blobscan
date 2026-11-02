import { GLOBAL_MAIN_SERIES_COLOR } from "./colors";
import { createTimeseriesChart } from "./factories";

export const TotalBlocksChart = createTimeseriesChart({
  baseProps: {
    title: "Total Blocks",
    yAxis: { type: "count" },
    timeseries: [
      {
        name: "Total Blocks",
        type: "bar",
        metric: "totalBlocks",
        color: GLOBAL_MAIN_SERIES_COLOR,
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
