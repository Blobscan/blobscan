import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyBlobStats } from "~/utils";
import { ChartBase } from "../ChartBase";

export type DailyBlobsSizeProps = {
  days: FormattedDailyBlobStats["days"];
  blobSizes: FormattedDailyBlobStats["blobSizes"];
  compact?: boolean;
};
export const DailyBlobSizeChart: FC<DailyBlobsSizeProps> = function ({
  days,
  blobSizes,
  compact = false,
}) {
  const options: EChartOption<
    EChartOption.SeriesBar | EChartOption.SeriesLine
  > = {
    xAxis: {
      type: "category",
      data: days,
    },
    yAxis: {
      type: "value",
      splitLine: { show: false },
      axisLabel: {
        formatter: (value: number) => `${value} KB`,
      },
    },
    series: [
      {
        name: "Blobs Size",
        data: blobSizes,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };

  return <ChartBase options={options} compact={compact} />;
};
