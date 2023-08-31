import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlobStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlobsChartProps = {
  days: DailyBlobStats["days"];
  blobs: DailyBlobStats["totalBlobs"];
  uniqueBlobs: DailyBlobStats["totalUniqueBlobs"];
};

export const DailyBlobsChart: FC<Partial<DailyBlobsChartProps>> = function ({
  days,
  blobs,
  uniqueBlobs,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions({
      dates: days,
      axisFormatters: {
        yAxisTooltip: formatNumber,
      },
    }),

    series: [
      {
        name: "Total Blobs",
        data: blobs,
        type: "bar",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        emphasis: { focus: "series" },
      },
      {
        name: "Total Unique Blobs",
        data: uniqueBlobs,
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
