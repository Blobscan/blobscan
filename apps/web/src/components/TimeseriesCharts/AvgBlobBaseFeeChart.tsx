import { createTimeseriesChart } from "../Charts/TimeseriesChartBase";
import { GLOBAL_MAIN_SERIES_COLOR } from "./colors";

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
        metric: "avgBlobBaseFee",
        color: GLOBAL_MAIN_SERIES_COLOR,
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
  requiredMetrics: ["avgBlobBaseFee"],
  componentName: "AvgBlobBaseFeeChart",
});
