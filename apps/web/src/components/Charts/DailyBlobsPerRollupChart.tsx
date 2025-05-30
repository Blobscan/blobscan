import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { Rollup, RollupDailyStats } from "~/types";
import { buildTimeSeriesOptions, capitalize, formatNumber } from "~/utils";

export type DailyRollupChartProps = {
  days: RollupDailyStats["days"];
  blobsPerRollup: RollupDailyStats["blobsPerRollup"];
};

export const DailyBlobsPerRollupChart: FC<Partial<DailyRollupChartProps>> =
  function ({ days, blobsPerRollup }) {
    const rollupNames =
      blobsPerRollup && blobsPerRollup[0]
        ? (Object.keys(blobsPerRollup[0]) as Uppercase<Rollup>[])
        : [];

    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => formatNumber(value),
        },
      }),
      series: rollupNames.map((rollup) => ({
        name: capitalize(rollup),
        type: "bar",
        stack: "total",
        data: blobsPerRollup
          ? blobsPerRollup.map((dayEntry) => dayEntry[rollup])
          : undefined,
      })),
      animationEasing: "cubicOut",
      toolbox: { show: false },
    };

    return <ChartCard title="Rollup Blob Usage" size="sm" options={options} />;
  };
