import type { FC } from "react";
import * as echarts from "echarts";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlobGasComparisonChartProps = Partial<{
  days: DailyBlockStats["days"];
  blobGasUsed: DailyBlockStats["totalBlobGasUsed"];
  blobAsCalldataGasUsed: DailyBlockStats["totalBlobAsCalldataGasUsed"];
  opts?: EChartOption;
}>;

export const DailyBlobGasComparisonChart: FC<DailyBlobGasComparisonChartProps> =
  function ({ blobAsCalldataGasUsed, blobGasUsed, days, opts = {} }) {
    const options: EChartOption<EChartOption.Series> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => (isNaN(value) ? "" : formatNumber(value)),
        },
      }),
      series: [
        {
          name: "Blob Gas Used",
          data: blobGasUsed,
          stack: "gas",
          type: "line",
          emphasis: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            focus: "series",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "rgba(58,77,233,0.8)",
              },
              {
                offset: 1,
                color: "rgba(58,77,233,0.3)",
              },
            ]),
          },
        },
        {
          name: "Equivalent Calldata Gas Used",
          data: blobAsCalldataGasUsed,
          stack: "gas",
          type: "line",
          itemStyle: {
            color: "#743737",
          },

          emphasis: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            focus: "series",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "rgba(213,72,120,0.8)",
              },
              {
                offset: 1,
                color: "rgba(213,72,120,0.3)",
              },
            ]),
          },
        },
      ],
      animationEasing: "backIn",
      ...opts,
    };

    return (
      <ChartCard
        title="Daily Blob Gas Comparison"
        size="sm"
        options={options}
      />
    );
  };
