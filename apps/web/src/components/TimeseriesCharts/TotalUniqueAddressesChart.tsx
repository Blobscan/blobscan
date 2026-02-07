import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const TotalUniqueAddressesChart = createTimeseriesChart({
  baseProps: {
    title: "Total Unique Addresses",
    yAxis: { type: "count" },
    timeseries: [
      {
        name: "Total Unique Receivers",
        type: "bar",
        metric: "totalUniqueReceivers",
      },
      {
        name: "Total Unique Senders",
        type: "bar",
        metric: "totalUniqueSenders",
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
  requiredMetrics: ["totalUniqueReceivers", "totalUniqueSenders"],
  componentName: "TotalUniqueAddressesChart",
});
