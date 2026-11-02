import {
  GLOBAL_MAIN_SERIES_COLOR,
  GLOBAL_SECONDARY_SERIES_COLOR,
} from "./colors";
import { createTimeseriesChart } from "./factories";

export const TotalBlobGasComparisonChart = createTimeseriesChart({
  baseProps: {
    title: "Total Blob Gas Expenditure Comparison",
    yAxis: {
      type: "count",
      unitType: "ether",
      unit: "wei",
      displayUnit: "Gwei",
    },
    timeseries: [
      {
        type: "line",
        name: "Total Blob Gas Used as Calldata",
        metric: "totalBlobAsCalldataGasUsed",
        color: GLOBAL_SECONDARY_SERIES_COLOR,
      },
      {
        type: "line",
        name: "Total Blob Gas Used",
        metric: "totalBlobGasUsed",
        color: GLOBAL_MAIN_SERIES_COLOR,
        // The calldata values are larger, so the calldata area covers this
        // series. Draw the main series above it.
        z: 3,
      },
    ],
    skeletonOpts: {
      chart: {
        variant: "line",
      },
      legend: {
        itemCount: 2,
      },
    },
  },
  requiredMetrics: ["totalBlobGasUsed", "totalBlobAsCalldataGasUsed"],
  componentName: "TotalBlobGasComparisonChart",
});
