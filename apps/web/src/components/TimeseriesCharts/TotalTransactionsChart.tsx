import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalTransactionsChart = createTimeseriesChart({
  baseProps: {
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
