import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyBlobStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

export type DailyBlobsChartProps = {
  days: FormattedDailyBlobStats["days"];
  blobs: FormattedDailyBlobStats["blobs"];
  uniqueBlobs: FormattedDailyBlobStats["uniqueBlobs"];
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
        emphasis: { focus: "series" },
      },
      {
        name: "Unique Blobs",
        data: uniqueBlobs,
        type: "bar",
        emphasis: { focus: "series" },
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartBase options={options} />;
};
