import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlobStats } from "~/types";
import { buildTimeSeriesOptions, formatBytes } from "~/utils";

export type DailyBlobsSizeProps = {
  days: DailyBlobStats["days"];
  blobSizes: DailyBlobStats["totalBlobSizes"];
  compact: boolean;
};
export const DailyBlobSizeChart: FC<Partial<DailyBlobsSizeProps>> = function ({
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
        name: "Blob Size",
        data: blobSizes,
        type: compact ? "line" : "bar",
        smooth: true,
      },
    ],
  };

  return <ChartCard title="Daily Blob Size" size="sm" options={options} />;
};
