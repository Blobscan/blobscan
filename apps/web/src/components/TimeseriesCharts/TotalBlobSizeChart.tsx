import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalBlobSizeChart = createTimeseriesChart({
  baseProps: {
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
