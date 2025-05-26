import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { EChartCompliantDailyStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlobsChartProps = Partial<{
  days: EChartCompliantDailyStats["day"][];
  totalBlobs: EChartCompliantDailyStats["totalBlobs"][];
  totalUniqueBlobs: EChartCompliantDailyStats["totalUniqueBlobs"][];
}>;

export const DailyBlobsChart: FC<DailyBlobsChartProps> = function ({
  days,
  totalBlobs,
  totalUniqueBlobs,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: (value) => formatNumber(value),
      },
    }),
    series: [
      {
        name: "Total Blobs",
        data: totalBlobs,
        type: "bar",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        emphasis: { focus: "series" },
      },
      {
        name: "Total Unique Blobs",
        data: totalUniqueBlobs,
        type: "bar",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        emphasis: { focus: "series" },
      },
    ],
    animationEasing: "cubicOut",
  };

  return <ChartCard title="Daily Blobs" size="sm" options={options} />;
};
