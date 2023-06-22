/* eslint-disable @typescript-eslint/ban-ts-comment */
import { type FC } from "react";
import { type EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import { type TransformedDailyTransactionStats } from "~/types";
import { ChartBase } from "../ChartBase";

export type DailyUniqueAddressesChartProps = {
  days?: TransformedDailyTransactionStats["days"];
  uniqueReceivers?: TransformedDailyTransactionStats["uniqueReceivers"];
  uniqueSenders?: TransformedDailyTransactionStats["uniqueSenders"];
};

export const DailyUniqueAddressesChart: FC<DailyUniqueAddressesChartProps> =
  function ({ days, uniqueReceivers, uniqueSenders }) {
    const isEmpty =
      !days?.length || !uniqueReceivers?.length || !uniqueSenders?.length;
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
      <ChartCard
        title="Daily Unique Addresses"
        size="sm"
        isEmptyChart={isEmpty}
      >
        <ChartBase options={options} />
      </ChartCard>
    );
  };
