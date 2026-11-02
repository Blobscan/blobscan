import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";
import { PRIMARY_SERIES_COLOR } from "./colors";

export const TotalBlocksChart = createTimeseriesChart({
  baseProps: {
    title: "Total Blocks",
    yAxis: { type: "count" },
    timeseries: [
      {
        name: "Total Blocks",
        type: "bar",
        metric: "totalBlocks",
        color: PRIMARY_SERIES_COLOR,
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
