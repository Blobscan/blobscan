import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyBlobStats } from "~/types";

type DailyAvgBlobSizeProps = {
  days?: TransformedDailyBlobStats["days"];
  avgBlobSizes?: TransformedDailyBlobStats["avgBlobSizes"];
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

  return <ChartCard title="Daily Avg. Blob Size" size="sm" options={options} />;
};
