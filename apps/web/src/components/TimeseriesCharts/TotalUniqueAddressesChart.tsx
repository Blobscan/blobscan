import {
  GLOBAL_MAIN_SERIES_COLOR,
  GLOBAL_SECONDARY_SERIES_COLOR,
} from "./colors";
import { createTimeseriesChart } from "./factories";

export const TotalUniqueAddressesChart = createTimeseriesChart({
  baseProps: {
    description:
      "The number of new blob transaction senders and receivers in each period, based on their first block in each role. An address can appear in both groups.",
    title: "Total Unique Addresses",
    yAxis: { type: "count" },
    timeseries: [
      {
        name: "Total Unique Receivers",
        type: "bar",
        metric: "totalUniqueReceivers",
        color: GLOBAL_SECONDARY_SERIES_COLOR,
      },
      {
        name: "Total Unique Senders",
        type: "bar",
        metric: "totalUniqueSenders",
        color: GLOBAL_MAIN_SERIES_COLOR,
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
