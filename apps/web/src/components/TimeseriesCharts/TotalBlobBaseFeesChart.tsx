import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalBlobBaseFeesChart = createTimeseriesChart({
  baseProps: {
    title: "Total Blob Base Fees",
    yAxis: {
      type: "count",
      unitType: "ether",
      unit: "wei",
      displayUnit: "Gwei",
    },
    timeseries: [
      {
        type: "bar",
        metric: "totalBlobBaseFee",
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
  requiredMetrics: ["totalBlobBaseFee"],
  componentName: "TotalBlobBaseFeesChart",
});
