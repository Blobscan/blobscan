import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlobStats } from "~/types";
import { formatBytes, buildTimeSeriesOptions } from "~/utils";

type DailyAvgBlobSizeProps = {
  days: DailyBlobStats["days"];
  avgBlobSizes: DailyBlobStats["avgBlobSizes"];
};

export const DailyAvgBlobSizeChart: FC<Partial<DailyAvgBlobSizeProps>> =
  function ({ days, avgBlobSizes }) {
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisLabel: (value: number) =>
            formatBytes(value, { maximumFractionDigits: 0 }),
          yAxisTooltip: (value: number) => formatBytes(value),
        },
        yUnit: "bytes",
      }),
      grid: { left: 55 },
      series: [
        {
          name: "Avg. Blob Size",
          data: avgBlobSizes,
          type: "bar",
        },
      ],
    };

    return (
      <ChartCard title="Daily Avg. Blob Size" size="sm" options={options} />
    );
  };
