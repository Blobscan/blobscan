/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { TransformedDailyTransactionStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyUniqueAddressesChartProps = {
  days?: TransformedDailyTransactionStats["days"];
  uniqueReceivers?: TransformedDailyTransactionStats["uniqueReceivers"];
  uniqueSenders?: TransformedDailyTransactionStats["uniqueSenders"];
};

export const DailyUniqueAddressesChart: FC<DailyUniqueAddressesChartProps> =
  function ({ days, uniqueReceivers, uniqueSenders }) {
    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions(days, {
        yAxisTooltip: (value) => formatNumber(value),
      }),
      series: [
        {
          name: "Unique Receivers",
          data: uniqueReceivers,
          type: "bar",
          // @ts-ignore
          emphasis: { focus: "series" },
        },
        {
          name: "Unique Senders",
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
