import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type AggregatedDailyBlobStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

export type DailyBlobsSizeProps = {
  days: AggregatedDailyBlobStats["days"];
  blobSizes: AggregatedDailyBlobStats["blobSizes"];
};
export const DailyBlobsSize: FC<DailyBlobsSizeProps> = function ({
  days,
  blobSizes,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    xAxis: {
      type: "category",
      data: days,
    },
    yAxis: {
      type: "value",
      splitLine: { show: false },
      axisLabel: { formatter: (name: string) => `${name} KBs` },
    },
    series: [
      {
        name: "Blobs Size (in KBs)",
        data: blobSizes,
        type: "bar",
      },
    ],
  };

  return <ChartBase options={options} />;
};
