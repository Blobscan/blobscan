import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

// Shades of the primary color (see @blobscan/tailwind-config). The average is
// the main line. The maximum and the minimum are lighter, and a band fills the
// range between them.
const AVG_COLOR = { light: "#5D25D4", dark: "#AE8CF5" };
const MAX_MIN_COLOR = { light: "#9A71F2", dark: "#C8AEFA" };
const RANGE_COLOR = { light: "#9A71F2", dark: "#AE8CF5" };
const RANGE_OPACITY = 0.15;
const MAX_MIN_LINE_STYLE = { type: "dashed", width: 1.5 } as const;

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
        areaOpacity: 0,
        lineStyle: MAX_MIN_LINE_STYLE,
      },
      {
        name: "Avg. ETH Price",
        type: "line",
        metric: "avgEthPrice",
        color: AVG_COLOR,
        areaOpacity: 0,
        lineStyle: { width: 3 },
      },
      {
        name: "Min. ETH Price",
        type: "line",
        metric: "minEthPrice",
        color: MAX_MIN_COLOR,
        areaOpacity: 0,
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
