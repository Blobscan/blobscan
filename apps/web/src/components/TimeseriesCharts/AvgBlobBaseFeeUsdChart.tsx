import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

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
  requiredMetrics: ["totalBlobBaseFeeUsd", "totalTransactions"],
  componentName: "AvgBlobBaseFeeUsdChart",
});
