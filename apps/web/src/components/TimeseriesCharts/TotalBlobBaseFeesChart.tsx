import { createTimeseriesChart } from "./factories";

export const TotalBlobBaseFeesChart = createTimeseriesChart({
  baseProps: {
    description:
      "The total blob base fees in each period. These fees exclude execution gas fees.",
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
