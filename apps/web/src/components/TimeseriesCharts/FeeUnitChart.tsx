import type { ReactNode } from "react";
import { useState } from "react";

import type {
  TimeseriesChartComponent,
  TimeseriesChartProps,
} from "../Charts/TimeseriesChartBase";
import { FeeUnitToggle } from "../Toggles";
import type { FeeUnit } from "../Toggles";

type FeeUnitChartProps = Omit<TimeseriesChartProps, "headerControls"> & {
  ethChart: TimeseriesChartComponent;
  usdChart: TimeseriesChartComponent;
  defaultUnit?: FeeUnit;
  headerControls?: (unit: FeeUnit) => ReactNode;
};

/**
 * Shows a fee chart in ETH or in USD. The chart header has an ETH/USD toggle
 * before the other header controls.
 */
export function FeeUnitChart({
  ethChart: EthChart,
  usdChart: UsdChart,
  defaultUnit = "eth",
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
            labels={{
              eth: EthChart.yUnit ?? "ETH",
              usd: UsdChart.yUnit ?? "USD",
            }}
            onChange={setUnit}
          />
          {headerControls?.(unit)}
        </div>
      }
    />
  );
}
