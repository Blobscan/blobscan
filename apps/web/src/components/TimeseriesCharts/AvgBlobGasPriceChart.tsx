import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const AvgBlobGasPriceChart = createTimeseriesChart({
  baseProps: {
    title: "Avg. Blob Gas Price",
    yAxis: {
      type: "average",
      unitType: "ether",
      unit: "wei",
      displayUnit: "Gwei",
    },
    timeseries: [
      {
        name: "Avg. Blob Gas Price",
        type: "line",
        metric: "avgBlobGasPrice",
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
  requiredMetrics: ["avgBlobGasPrice"],
  componentName: "AvgBlobGasPriceChart",
});
