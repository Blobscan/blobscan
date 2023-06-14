import { type FC } from "react";
import { type EChartOption } from "echarts";

import { ChartBase } from "./ChartBase";

export type DailyBlobsChartProps = {
  days: string[];
  blobs: number[];
  uniqueBlobs: number[];
};

export const DailyBlobsChart: FC<DailyBlobsChartProps> = function ({
  days,
  blobs,
  uniqueBlobs,
}) {
  const options: EChartOption<EChartOption.SeriesLine> = {
    xAxis: {
      type: "category",
      data: days,
    },
    yAxis: {
      type: "value",
      splitLine: { show: false },
    },
    series: [
      {
        name: "Blobs",
        data: blobs,
        type: "line",
        smooth: true,
        emphasis: { focus: "series" },
      },
      {
        name: "Unique Blobs",
        data: uniqueBlobs,
        type: "line",
        smooth: true,
        areaStyle: { opacity: 0 },
        emphasis: { focus: "series" },
      },
    ],
    tooltip: {
      trigger: "axis",
    },
  };

  return <ChartBase options={options} />;
};
