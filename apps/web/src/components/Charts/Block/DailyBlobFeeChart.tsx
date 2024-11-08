import type { FC } from "react";
import type { EChartOption } from "echarts";

import { formatWei, prettyFormatWei } from "@blobscan/eth-units";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { DailyBlockStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyBlobFeeChartProps = {
  days: DailyBlockStats["days"];
  blobFees: DailyBlockStats["totalBlobFees"];
};

export const DailyBlobFeeChart: FC<Partial<DailyBlobFeeChartProps>> =
  function ({ days, blobFees }) {
    const data = blobFees?.map((x) => Number(x));
    const { unit } = useScaledWeiAmounts(data);

    const options: EChartOption<EChartOption.SeriesBar> = {
      ...buildTimeSeriesOptions({
        dates: days,
        axisFormatters: {
          yAxisTooltip: (value) =>
            formatWei(value, unit, { displayUnit: true }),
          yAxisLabel: (value) => prettyFormatWei(value, unit),
        },
      }),
      series: [
        {
          name: "Blob Fees",
          data: data,
          type: "bar",
        },
      ],
      animationEasing: "cubicOut",
    };

    return (
      <ChartCard
        title={`Daily Blob Fees (in ${unit})`}
        size="sm"
        options={options}
      />
    );
  };
