import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

// Okabe-Ito colors. They stay distinct for color-blind viewers.
const MAX_COLOR = { light: "#d55e00", dark: "#e69f00" };
const AVG_COLOR = { light: "#0072b2", dark: "#56b4e9" };
const MIN_COLOR = { light: "#009e73", dark: "#1fc79a" };

export const EthPriceChart = createTimeseriesChart({
  baseProps: {
    title: "ETH Price",
    highlightAllSeries: true,
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
        color: MAX_COLOR,
        area: false,
      },
      {
        name: "Avg. ETH Price",
        type: "line",
        metric: "avgEthPrice",
        color: AVG_COLOR,
        area: false,
      },
      {
        name: "Min. ETH Price",
        type: "line",
        metric: "minEthPrice",
        color: MIN_COLOR,
        area: false,
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
