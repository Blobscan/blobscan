import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyBlobStats } from "~/types";
import { buildTimeSeriesOptions, formatBytes } from "~/utils";

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
    ...buildTimeSeriesOptions(days, {
      yAxisLabel: (value: number) =>
        formatBytes(value, { maximumFractionDigits: 0 }),
      yAxisTooltip: (value: number) => formatBytes(value),
    }),
    series: [
      {
        name: "Size",
        data: blobSizes,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };

  return <ChartCard title="Daily Blob Size" size="sm" options={options} />;
};
