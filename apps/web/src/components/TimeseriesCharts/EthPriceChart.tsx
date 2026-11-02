import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";
import { PRIMARY_SERIES_COLOR, SECONDARY_SERIES_COLOR } from "./colors";

// The average is the main line. The maximum and the minimum have a very
// different intensity and no area.
const AVG_COLOR = PRIMARY_SERIES_COLOR;
const MAX_MIN_COLOR = SECONDARY_SERIES_COLOR;
const MAX_MIN_LINE_STYLE = { width: 2 } as const;

export const EthPriceChart = createTimeseriesChart({
  baseProps: {
    title: "ETH Price",
    yAxis: {
      type: "average",
      unitType: "fiat",
      unit: "USD",
      // A price does not start at zero. Fit the axis to the values.
      scale: true,
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
        lineStyle: { width: 3 },
        // Draw the average above the maximum and the minimum.
        z: 3,
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
