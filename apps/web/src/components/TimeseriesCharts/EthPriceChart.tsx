import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

// Shades of the primary color (see @blobscan/tailwind-config). The average is
// the main line. The maximum and the minimum have a very different intensity,
// and a band fills the range between them.
const AVG_COLOR = { light: "#5D25D4", dark: "#C8AEFA" };
const MAX_MIN_COLOR = { light: "#C8AEFA", dark: "#5D25D4" };
const RANGE_COLOR = { light: "#AE8CF5", dark: "#5D25D4" };
const RANGE_OPACITY = 0.2;
const MAX_MIN_LINE_STYLE = { type: "dashed", width: 2 } as const;

export const EthPriceChart = createTimeseriesChart({
  baseProps: {
    title: "ETH Price",
    highlightAllSeries: true,
    yAxis: {
      type: "average",
      unitType: "fiat",
      unit: "USD",
    },
    range: {
      lower: "minEthPrice",
      upper: "maxEthPrice",
      color: RANGE_COLOR,
      opacity: RANGE_OPACITY,
    },
    timeseries: [
      {
        name: "Max. ETH Price",
        type: "line",
        metric: "maxEthPrice",
        color: MAX_MIN_COLOR,
        showArea: false,
        lineStyle: MAX_MIN_LINE_STYLE,
      },
      {
        name: "Avg. ETH Price",
        type: "line",
        metric: "avgEthPrice",
        color: AVG_COLOR,
        showArea: false,
        lineStyle: { width: 3 },
      },
      {
        name: "Min. ETH Price",
        type: "line",
        metric: "minEthPrice",
        color: MAX_MIN_COLOR,
        showArea: false,
        lineStyle: MAX_MIN_LINE_STYLE,
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
