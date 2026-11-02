import type { ReactNode } from "react";
import { useState } from "react";

import type {
  TimeseriesChartComponent,
  TimeseriesChartProps,
} from "../Charts/TimeseriesChartBase";
import { FeeUnitToggle } from "../Toggles";
import type { FeeUnit } from "../Toggles";

type FeeUnitChartProps = Omit<
  TimeseriesChartProps,
  "headerControls" | "unitControl"
> & {
  ethChart: TimeseriesChartComponent;
  usdChart: TimeseriesChartComponent;
  defaultUnit?: FeeUnit;
  headerControls?: (unit: FeeUnit) => ReactNode;
};

/**
 * Shows a fee chart in ETH or in USD. The chart title has an ETH/USD toggle
 * in place of its unit.
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
      headerControls={headerControls?.(unit)}
      unitControl={
        <FeeUnitToggle
          unit={unit}
          labels={{
            eth: EthChart.yUnit ?? "ETH",
            usd: UsdChart.yUnit ?? "USD",
          }}
          onChange={setUnit}
        />
      }
    />
  );
}
