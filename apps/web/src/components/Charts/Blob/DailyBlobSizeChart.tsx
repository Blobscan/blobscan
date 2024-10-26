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
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisLabel: (value) =>
          formatBytes(Number(value), {
            unit: "GiB",
            hideUnit: true,
          }),
        yAxisTooltip: (value) =>
          formatBytes(Number(value), { unit: "GiB", displayAllDecimals: true }),
      },
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

  return (
    <ChartCard title="Daily Blob Size (in GiB)" size="sm" options={options} />
  );
};
