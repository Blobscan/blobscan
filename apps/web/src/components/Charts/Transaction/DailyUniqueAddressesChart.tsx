/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyTransactionStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyUniqueAddressesChartProps = {
  days: DailyTransactionStats["days"];
  uniqueReceivers: DailyTransactionStats["totalUniqueReceivers"];
  uniqueSenders: DailyTransactionStats["totalUniqueSenders"];
};

export const DailyUniqueAddressesChart: FC<
  Partial<DailyUniqueAddressesChartProps>
> = function ({ days, uniqueReceivers, uniqueSenders }) {
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
        data: uniqueReceivers,
        type: "bar",
        // @ts-ignore
        emphasis: { focus: "series" },
      },
      {
        name: "Total Unique Senders",
        data: uniqueSenders,
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
