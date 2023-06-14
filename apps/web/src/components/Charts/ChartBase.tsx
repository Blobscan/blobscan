import { type FC } from "react";
import { type EChartOption } from "echarts";
import EChartsReact from "echarts-for-react";

type ChartBaseProps = {
  options: EChartOption;
};

const COMMON_OPTIONS: EChartOption = {
  grid: { top: 10, right: 20, bottom: 24, left: 40 },
  tooltip: {
    trigger: "axis",
  },
};

export const ChartBase: FC<ChartBaseProps> = function ({ options }) {
  return (
    <EChartsReact
      option={{
        ...COMMON_OPTIONS,
        ...options,
      }}
    />
  );
};
