import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyBlobStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyBlobsChartProps = Partial<{
  days: TransformedDailyBlobStats["days"];
  blobs: TransformedDailyBlobStats["blobs"];
  uniqueBlobs: TransformedDailyBlobStats["uniqueBlobs"];
}>;

export const DailyBlobsChart: FC<DailyBlobsChartProps> = function ({
  days,
  blobs,
  uniqueBlobs,
}) {
  const options: EChartOption<EChartOption.SeriesBar> = {
    ...buildTimeSeriesOptions(days),

    series: [
      {
        name: "Blobs",
        data: blobs,
        type: "bar",
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        emphasis: { focus: "series" },
      },
      {
        name: "Unique Blobs",
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
