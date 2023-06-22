import { type FC } from "react";
import { type EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import { type TransformedDailyBlobStats } from "~/types";
import { ChartBase } from "../ChartBase";

export type DailyBlobsChartProps = {
  days?: TransformedDailyBlobStats["days"];
  blobs?: TransformedDailyBlobStats["blobs"];
  uniqueBlobs: TransformedDailyBlobStats["uniqueBlobs"];
};

export const DailyBlobsChart: FC<DailyBlobsChartProps> = function ({
  days,
  blobs,
  uniqueBlobs,
}) {
  const isEmpty = !days?.length || !blobs?.length;
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

  return (
    <ChartCard title="Daily Blobs" size="sm" isEmptyChart={isEmpty}>
      <ChartBase options={options} />
    </ChartCard>
  );
};
