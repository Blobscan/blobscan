import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyBlobStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

type DailyAvgBlobSizeProps = {
  days: FormattedDailyBlobStats["days"];
  avgBlobSizes: FormattedDailyBlobStats["avgBlobSizes"];
};

export const DailyAvgBlobSizeChart: FC<DailyAvgBlobSizeProps> = function ({
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
