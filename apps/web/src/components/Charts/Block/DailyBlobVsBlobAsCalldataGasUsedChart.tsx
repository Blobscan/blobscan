import type { FC } from "react";
import type { EChartOption } from "echarts";

import { ChartCard } from "~/components/Cards/ChartCard";
import type { SingleDailyBlockStats } from "~/types";
import { buildTimeSeriesOptions, formatNumber } from "~/utils";

export type DailyBlobVsBlobAsCalldataGasUsedChartProps = Partial<{
  days: SingleDailyBlockStats["day"][];
  blobGasUsed: SingleDailyBlockStats["totalBlobGasUsed"][];
  blobAsCalldataGasUsed: SingleDailyBlockStats["totalBlobAsCalldataGasUsed"][];
}>;

export const DailylBlobVsBlobAsCalldataGasUsedChart: FC<DailyBlobVsBlobAsCalldataGasUsedChartProps> =
  function ({ days, blobGasUsed, blobAsCalldataGasUsed }) {
    const options: EChartOption<EChartOption.Series> = {
      ...buildTimeSeriesOptions(days, {
        yAxisTooltip: (value) => (isNaN(value) ? "" : formatNumber(value)),
      }),
      series: [
        {
          name: "Blob Gas Used",
          data: blobGasUsed,
          stack: "gas",
          type: "bar",
          emphasis: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            focus: "series",
          },
        },
        {
          name: "Blob as Calldata Gas Used",
          data: blobAsCalldataGasUsed,
          stack: "gas",
          type: "bar",
          itemStyle: {
            color: "#743737",
          },
          emphasis: {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            focus: "series",
          },
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard
        title="Blob vs. Blob as Calldata Gas Used"
        size="sm"
        options={options}
      />
    );
  };
