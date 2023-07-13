import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyBlobStats } from "~/types";

export type DailyBlobsSizeProps = {
  days?: TransformedDailyBlobStats["days"];
  blobSizes?: TransformedDailyBlobStats["blobSizes"];
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

  return <ChartCard title="Daily Blob Size" size="sm" options={options} />;
};
