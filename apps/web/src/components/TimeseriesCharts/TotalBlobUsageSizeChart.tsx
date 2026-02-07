import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalBlobUsageSizeChart = createTimeseriesChart({
  baseProps: {
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
