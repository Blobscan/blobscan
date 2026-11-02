import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";
import {
  GLOBAL_MAIN_SERIES_COLOR,
  GLOBAL_SECONDARY_SERIES_COLOR,
} from "./colors";

// The average is the main line. The maximum and the minimum have a very
// different intensity and no area. They are drawn above the area of the
// average, because the area fills the chart up to the average line and
// covers the minimum.
const MAX_MIN_SERIES_STYLE = {
  type: "line",
  color: GLOBAL_SECONDARY_SERIES_COLOR,
  showArea: false,
  lineStyle: { width: 2 },
  z: 3,
} as const;

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
        ...MAX_MIN_SERIES_STYLE,
        name: "Max. ETH Price",
        metric: "maxEthPrice",
      },
      {
        name: "Avg. ETH Price",
        type: "line",
        metric: "avgEthPrice",
        color: GLOBAL_MAIN_SERIES_COLOR,
        lineStyle: { width: 3 },
      },
      {
        ...MAX_MIN_SERIES_STYLE,
        name: "Min. ETH Price",
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
