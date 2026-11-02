import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";
import { PRIMARY_SERIES_COLOR, SECONDARY_SERIES_COLOR } from "./colors";

export const TotalUniqueAddressesChart = createTimeseriesChart({
  baseProps: {
    title: "Total Unique Addresses",
    yAxis: { type: "count" },
    timeseries: [
      {
        name: "Total Unique Receivers",
        type: "bar",
        metric: "totalUniqueReceivers",
        color: SECONDARY_SERIES_COLOR,
      },
      {
        name: "Total Unique Senders",
        type: "bar",
        metric: "totalUniqueSenders",
        color: PRIMARY_SERIES_COLOR,
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
