import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";
import { PRIMARY_SERIES_COLOR, SECONDARY_SERIES_COLOR } from "./colors";

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
        color: SECONDARY_SERIES_COLOR,
      },
      {
        type: "line",
        name: "Total Blob Gas Used",
        metric: "totalBlobGasUsed",
        color: PRIMARY_SERIES_COLOR,
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
