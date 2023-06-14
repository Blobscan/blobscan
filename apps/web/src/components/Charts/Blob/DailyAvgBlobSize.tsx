import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type AggregatedDailyBlobStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

type DailyAvgBlobSizeProps = {
  days: AggregatedDailyBlobStats["days"];
  avgBlobSizes: AggregatedDailyBlobStats["avgBlobSizes"];
};

export const DailyAvgBlobSize: FC<DailyAvgBlobSizeProps> = function ({
  days,
  avgBlobSizes,
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
        name: "Blobs Size",
        data: avgBlobSizes,
        type: "bar",
      },
    ],
  };

  return <ChartBase options={options} />;
};
