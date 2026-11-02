import type { ReactNode } from "react";
import { useState } from "react";

import type { TimeseriesChartProps } from "../Charts/TimeseriesChartBase";
import { FeeUnitToggle } from "../Toggles";
import type { FeeUnit } from "../Toggles";
import type { TimeseriesChartComponent } from "./factories";

type FeeUnitChartProps = Omit<TimeseriesChartProps, "headerControls"> & {
  ethChart: TimeseriesChartComponent;
  usdChart: TimeseriesChartComponent;
  defaultUnit: FeeUnit;
  headerControls?: (unit: FeeUnit) => ReactNode;
};

/**
 * The text of each unit in the ETH/USD toggle: the y-axis unit of the chart of
 * that unit (e.g. "Gwei").
 */
export function getFeeUnitLabels(
  ethChart: TimeseriesChartComponent,
  usdChart: TimeseriesChartComponent
): Record<FeeUnit, string> {
  return {
    eth: ethChart.yUnit ?? "ETH",
    usd: usdChart.yUnit ?? "USD",
  };
}

/**
 * Shows a fee chart in ETH or in USD. The chart header has an ETH/USD toggle
 * before the other header controls.
 */
export function FeeUnitChart({
  ethChart: EthChart,
  usdChart: UsdChart,
  defaultUnit,
  headerControls,
  ...chartProps
}: FeeUnitChartProps) {
  const [unit, setUnit] = useState<FeeUnit>(defaultUnit);
  const Chart = unit === "usd" ? UsdChart : EthChart;

  return (
    <Chart
      {...chartProps}
      headerControls={
        <div className="flex items-center gap-3">
          <FeeUnitToggle
            unit={unit}
            labels={getFeeUnitLabels(EthChart, UsdChart)}
            onChange={setUnit}
          />
          {headerControls?.(unit)}
        </div>
      }
    />
  );
}
