import { createTimeseriesChart } from "./factories";

export const TotalTransactionsChart = createTimeseriesChart({
  baseProps: {
    description: "The number of blob transactions in each period.",
    title: "Total Transactions",
    yAxis: { type: "count" },
    timeseries: [
      {
        type: "bar",
        metric: "totalTransactions",
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
  requiredMetrics: ["totalTransactions"],
  componentName: "TotalTransactionsChart",
});
