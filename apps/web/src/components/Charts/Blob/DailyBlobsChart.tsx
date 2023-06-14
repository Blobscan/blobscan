import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type AggregatedDailyBlobStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

export type DailyBlobsChartProps = {
  days: AggregatedDailyBlobStats["days"];
  blobs: AggregatedDailyBlobStats["blobs"];
  uniqueBlobs: AggregatedDailyBlobStats["uniqueBlobs"];
};

export const DailyBlobsChart: FC<DailyBlobsChartProps> = function ({
  days,
  blobs,
  uniqueBlobs,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
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
        type: "bar",
        smooth: true,
        emphasis: { focus: "series" },
      },
      {
        name: "Unique Blobs",
        data: uniqueBlobs,
        type: "bar",
        smooth: true,
        areaStyle: { opacity: 0 },
        emphasis: { focus: "series" },
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartBase options={options} />;
};
