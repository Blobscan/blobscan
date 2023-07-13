import type { FC } from "react";
import type { EChartOption } from "echarts";
import EChartsReact from "echarts-for-react";

import { abbreviateNumber, formatDate } from "~/utils";

type ChartBaseProps = {
  options: EChartOption;
  compact?: boolean;
};

const COMMON_OPTIONS: EChartOption = {
  grid: { top: 10, right: 10, bottom: 24, left: 60 },
  yAxis: {
    axisLabel: { formatter: (value: number) => abbreviateNumber(value) },
  },
  tooltip: {
    trigger: "axis",
  },
};

export const ChartBase: FC<ChartBaseProps> = function ({
  options,
  compact = false,
}) {
  return (
    <EChartsReact
      option={{
        ...COMMON_OPTIONS,
        ...options,
        xAxis: {
          ...(COMMON_OPTIONS.xAxis || {}),
          ...(options.xAxis || {}),
          ...(compact
            ? {
                axisLine: { show: false },
                axisLabel: {
                  interval: 4,
                  formatter: (day: string) =>
                    formatDate(day, { hideYear: true }),
                },
              }
            : {}),
        },
        yAxis: {
          ...(COMMON_OPTIONS.yAxis || {}),
          ...(options.yAxis || {}),
          axisLine: { show: !compact },
        },
      }}
      style={{ height: "100%", width: "100%" }}
    />
  );
};
