import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";
import { PRIMARY_SERIES_COLOR } from "./colors";

export const AvgBlobBaseFeeUsdChart = createTimeseriesChart({
  baseProps: {
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
        color: PRIMARY_SERIES_COLOR,
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
