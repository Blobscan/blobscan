import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyBlobStats } from "~/types";
import { formatBytes, buildTimeSeriesOptions } from "~/utils";

type DailyAvgBlobSizeProps = {
  days?: TransformedDailyBlobStats["days"];
  avgBlobSizes?: TransformedDailyBlobStats["avgBlobSizes"];
};

export const DailyAvgBlobSizeChart: FC<DailyAvgBlobSizeProps> = function ({
  days,
  avgBlobSizes,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions(days, {
      yAxisLabel: (value: number) =>
        formatBytes(value, { maximumFractionDigits: 0 }),
      yAxisTooltip: (value: number) => formatBytes(value),
    }),
    series: [
      {
        name: "Avg. Size",
        data: avgBlobSizes,
        type: "bar",
      },
    ],
  };

  return <ChartCard title="Daily Avg. Blob Size" size="sm" options={options} />;
};
