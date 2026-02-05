import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";

export const AvgBlobBaseFeeChart = createTimeseriesChart({
  baseProps: {
    title: "Avg. Blob Base Fee",
    yAxis: {
      type: "average",
      unitType: "ether",
      unit: "wei",
      displayUnit: "Gwei",
    },
    timeseries: [
      {
        name: "Avg. Blob Base Fee",
        type: "line",
        metric: "avgBlobFee",
      },
    ],
    skeletonOpts: {
      chart: {
        variant: "line",
      },
      legend: {
        itemCount: 1,
      },
    },
  },
  requiredMetrics: ["avgBlobFee"],
  componentName: "AvgBlobBaseFeeChart",
});
