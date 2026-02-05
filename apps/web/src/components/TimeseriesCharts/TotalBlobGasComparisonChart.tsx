import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

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
      },
      {
        type: "line",
        name: "Total Blob Gas Used",
        metric: "totalBlobGasUsed",
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
