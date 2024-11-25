import type { FC } from "react";
import type { EChartOption } from "echarts";

import { formatWei, prettyFormatWei } from "@blobscan/eth-format";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyAvgBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  avgBlobFees: DailyBlockStats["avgBlobFees"];
};

export const DailyAvgBlobFeeChart: FC<Partial<DailyAvgBlobFeeChartProps>> =
  function ({ days, avgBlobFees }) {
    const { unit } = useScaledWeiAmounts(avgBlobFees);

    const options: EChartOption<EChartOption.Series> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) => formatWei(value, { toUnit: unit }),
          yAxisLabel: (value) =>
            prettyFormatWei(value, { toUnit: unit, hideUnit: true }),
        },
      }),
      series: [
        {
          name: "Avg. Blob Fees",
          data: avgBlobFees,
          type: "line",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard
        title={`Daily Avg. Blob Fee (in ${unit})`}
        size="sm"
        options={options}
      />
    );
  };
