import type { FC } from "react";
import type { EChartOption } from "echarts";

import { formatWei, prettyFormatWei } from "@blobscan/eth-format";

import { ChartCard } from "~/components/Cards/ChartCard";
import { useScaledWeiAmounts } from "~/hooks/useScaledWeiAmounts";
import type { EChartCompliantDailyStats } from "~/types";
import { buildTimeSeriesOptions } from "~/utils";

export type DailyBlobFeeChartProps = Partial<{
  days: EChartCompliantDailyStats["day"][];
  totalBlobFees: EChartCompliantDailyStats["totalBlobFee"][];
}>;

export const DailyBlobFeeChart: FC<DailyBlobFeeChartProps> = function ({
  days,
  totalBlobFees,
}) {
  const data = totalBlobFees?.map((x) => Number(x));
  const { unit } = useScaledWeiAmounts(data);

  const options: EChartOption<EChartOption.SeriesBar> = {
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
        name: "Blob Fees",
        data: totalBlobFees,
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
