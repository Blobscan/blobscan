/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { EChartCompliantDailyStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyUniqueAddressesChartProps = Partial<{
  days: EChartCompliantDailyStats["day"][];
  totalUniqueReceivers: EChartCompliantDailyStats["totalUniqueReceivers"][];
  totalUniqueSenders: EChartCompliantDailyStats["totalUniqueSenders"][];
}>;

export const DailyUniqueAddressesChart: FC<DailyUniqueAddressesChartProps> =
  function ({ days, totalUniqueReceivers, totalUniqueSenders }) {
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => formatNumber(value),
        },
      }),
      series: [
        {
          name: "Total Unique Receivers",
          data: totalUniqueReceivers,
          type: "bar",
          // @ts-ignore
          emphasis: { focus: "series" },
        },
        {
          name: "Total Unique Senders",
          data: totalUniqueSenders,
          type: "bar",
          // @ts-ignore
          emphasis: { focus: "series" },
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard title="Daily Unique Addresses" size="sm" options={options} />
    );
  };
