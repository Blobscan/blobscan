import { createTimeseriesChart } from "./factories";

export const TotalBlobBaseFeesUsdChart = createTimeseriesChart({
  baseProps: {
    description:
      "The total blob base fees in each period, in USD. These fees exclude execution gas fees.",
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
