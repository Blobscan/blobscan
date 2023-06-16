import { type FC } from "react";
import { type EChartOption } from "echarts";

import { type FormattedDailyTransactionStats } from "~/utils/stats";
import { ChartBase } from "../ChartBase";

export type DailyUniqueAddressesChartProps = {
  days: FormattedDailyTransactionStats["days"];
  uniqueReceivers: FormattedDailyTransactionStats["uniqueReceivers"];
  uniqueSenders: FormattedDailyTransactionStats["uniqueSenders"];
};

export const DailyUniqueAddressesChart: FC<DailyUniqueAddressesChartProps> =
  function ({ days, uniqueReceivers, uniqueSenders }) {
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
          emphasis: { focus: "series" },
        },
        {
          name: "Unique Senders",
          data: uniqueSenders,
          type: "bar",
          emphasis: { focus: "series" },
        },
      ],
      animationEasing: "cubicOut",
    };

    return <ChartBase options={options} />;
  };
