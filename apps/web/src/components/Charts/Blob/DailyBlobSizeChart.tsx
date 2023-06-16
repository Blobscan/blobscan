import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyBlobStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

export type DailyBlobsSizeProps = {
  days: FormattedDailyBlobStats["days"];
  blobSizes: FormattedDailyBlobStats["blobSizes"];
};
export const DailyBlobSizeChart: FC<DailyBlobsSizeProps> = function ({
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
