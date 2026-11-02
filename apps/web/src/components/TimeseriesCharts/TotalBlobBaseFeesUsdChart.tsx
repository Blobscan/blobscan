import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalBlobBaseFeesUsdChart = createTimeseriesChart({
  baseProps: {
    title: "Total Blob Base Fees",
    yAxis: {
      type: "count",
      unitType: "fiat",
      unit: "USD",
    },
    timeseries: [
      {
        type: "bar",
        metric: "totalBlobBaseFeeUsd",
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
  requiredMetrics: ["totalBlobBaseFeeUsd"],
  componentName: "TotalBlobBaseFeesUsdChart",
});
