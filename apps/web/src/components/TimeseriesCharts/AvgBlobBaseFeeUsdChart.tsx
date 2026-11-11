import { GLOBAL_MAIN_SERIES_COLOR } from "./colors";
import { createTimeseriesChart } from "./factories";

export const AvgBlobBaseFeeUsdChart = createTimeseriesChart({
  baseProps: {
    description:
      "The average blob base fee per transaction in each period, in USD. This fee excludes execution gas fees.",
    title: "Avg. Blob Base Fee",
    yAxis: {
      type: "average",
      unitType: "fiat",
      unit: "USD",
    },
    timeseries: [
      {
        name: "Avg. Blob Base Fee",
        type: "line",
        metric: "avgBlobBaseFeeUsd",
        color: GLOBAL_MAIN_SERIES_COLOR,
      },
    ],
    skeletonOpts: {
      chart: {
        variant: "line",
      },
      legend: {
        itemCount: 1,
      },
    },
  },
  requiredMetrics: ["totalBlobBaseFeeUsd", "totalUsdPricedTransactions"],
  componentName: "AvgBlobBaseFeeUsdChart",
});
