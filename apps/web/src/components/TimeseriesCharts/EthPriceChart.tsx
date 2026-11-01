import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const EthPriceChart = createTimeseriesChart({
  baseProps: {
    title: "ETH Price",
    yAxis: {
      type: "average",
      unitType: "fiat",
      unit: "USD",
    },
    timeseries: [
      {
        name: "Max. ETH Price",
        type: "line",
        metric: "maxEthPrice",
      },
      {
        name: "Avg. ETH Price",
        type: "line",
        metric: "avgEthPrice",
      },
      {
        name: "Min. ETH Price",
        type: "line",
        metric: "minEthPrice",
      },
    ],
    skeletonOpts: {
      chart: {
        variant: "line",
      },
      legend: {
        itemCount: 3,
      },
    },
  },
  requiredMetrics: ["maxEthPrice", "avgEthPrice", "minEthPrice"],
  componentName: "EthPriceChart",
});
