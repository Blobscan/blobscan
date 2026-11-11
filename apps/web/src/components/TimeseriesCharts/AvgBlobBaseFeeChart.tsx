import { GLOBAL_MAIN_SERIES_COLOR } from "./colors";
import { createTimeseriesChart } from "./factories";

export const AvgBlobBaseFeeChart = createTimeseriesChart({
  baseProps: {
    description:
      "The average blob base fee per transaction in each period. This fee excludes execution gas fees.",
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
