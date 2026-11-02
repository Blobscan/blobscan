import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

// The same shades of the primary color as the ETH price chart. The average is
// the main line. The maximum and the minimum have a very different intensity,
// and a band fills the range between them.
const AVG_COLOR = { light: "#5D25D4", dark: "#C8AEFA" };
const MAX_MIN_COLOR = { light: "#C8AEFA", dark: "#5D25D4" };
const RANGE_COLOR = { light: "#AE8CF5", dark: "#5D25D4" };
const RANGE_OPACITY = 0.2;
const MAX_MIN_LINE_STYLE = { type: "dashed", width: 2 } as const;

export const BlobGasPriceChart = createTimeseriesChart({
  baseProps: {
    title: "Blob Gas Price",
    highlightAllSeries: true,
    yAxis: {
      type: "average",
      unitType: "ether",
      unit: "wei",
      displayUnit: "Gwei",
    },
    range: {
      lower: "minBlobGasPrice",
      upper: "maxBlobGasPrice",
      color: RANGE_COLOR,
      opacity: RANGE_OPACITY,
    },
    timeseries: [
      {
        name: "Max. Blob Gas Price",
        type: "line",
        metric: "maxBlobGasPrice",
        color: MAX_MIN_COLOR,
        showArea: false,
        lineStyle: MAX_MIN_LINE_STYLE,
      },
      {
        name: "Avg. Blob Gas Price",
        type: "line",
        metric: "avgBlobGasPrice",
        color: AVG_COLOR,
        showArea: false,
        lineStyle: { width: 3 },
      },
      {
        name: "Min. Blob Gas Price",
        type: "line",
        metric: "minBlobGasPrice",
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
  requiredMetrics: ["maxBlobGasPrice", "avgBlobGasPrice", "minBlobGasPrice"],
  componentName: "BlobGasPriceChart",
});
