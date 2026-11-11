import type { ReactNode } from "react";
import { useState } from "react";

import type { TimeseriesChartProps } from "../Charts/TimeseriesChartBase";
import { FeeUnitToggle } from "../Toggles";
import type { FeeUnit } from "../Toggles";
import type { TimeseriesChartComponent } from "./factories";

type FeeUnitChartProps = Omit<TimeseriesChartProps, "headerControls"> & {
  ethChart: TimeseriesChartComponent;
  usdChart?: TimeseriesChartComponent;
  defaultUnit: FeeUnit;
  headerControls?: (unit: FeeUnit) => ReactNode;
};

/**
 * Shows a fee chart in ETH or in USD. The chart header has an ETH/USD toggle
 * before the other header controls. Without a USD chart, it shows only
 * the ETH chart and no toggle.
 */
export function FeeUnitChart({
  ethChart: EthChart,
  usdChart: UsdChart,
  defaultUnit,
  headerControls,
  isLoading,
  ...chartProps
}: FeeUnitChartProps) {
  const [unit, setUnit] = useState<FeeUnit>(defaultUnit);

  if (!UsdChart) {
    return (
      <EthChart
        {...chartProps}
        isLoading={isLoading}
        headerControls={headerControls?.("eth")}
      />
    );
  }

  const Chart = unit === "usd" ? UsdChart : EthChart;

  return (
    <Chart
      {...chartProps}
      isLoading={isLoading}
      headerControls={
        <div className="flex items-center gap-3">
          <FeeUnitToggle
            unit={unit}
            etherUnit={EthChart.yUnit}
            onChange={setUnit}
          />
          {headerControls?.(unit)}
        </div>
      }
    />
  );
}
