import type { FC } from "react";

import { RollupSelector } from "../Selectors";
import { CategorySelector } from "../Selectors/CategorySelector";
import { FeeUnitToggle } from "../Toggles";
import { ControlBarLayout } from "./ControlBarLayout";
import { useControlState } from "./useControlState";

export type TimeseriesControlBarProps = {
  /**
   * Show the category and rollup filters.
   */
  showCategoryFilters?: boolean;
  /**
   * Show the USD/Ether toggle. etherUnit is the unit of the Ether values
   * (e.g. "Gwei").
   */
  feeUnit?: { etherUnit?: string };
};

export const TimeseriesControlBar: FC<TimeseriesControlBarProps> = ({
  showCategoryFilters = true,
  feeUnit,
}) => {
  const { state, actions, apply, clear } = useControlState();

  const disableClear =
    !state.categories && !state.rollups?.length && state.unit === "eth";
  const etherUnit = feeUnit?.etherUnit;

  return (
    <ControlBarLayout
      onApply={apply}
      onClear={clear}
      disableClear={disableClear}
    >
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row lg:max-w-2xl lg:justify-start">
        {showCategoryFilters && (
          <div className="flex min-w-0 flex-1 flex-row gap-2">
            <div className="w-28 shrink-0">
              <CategorySelector
                selected={state.categories}
                onChange={actions.setCategory}
              />
            </div>

            <div className="min-w-0 flex-1 basis-0">
              <RollupSelector
                selected={state.rollups}
                onChange={actions.setRollups}
              />
            </div>
          </div>
        )}

        {feeUnit && (
          <div className="w-full shrink-0 sm:w-36">
            <FeeUnitToggle
              variant="control"
              unit={state.unit}
              labels={{
                eth:
                  etherUnit && etherUnit !== "ETH"
                    ? `Ether (${etherUnit})`
                    : "Ether",
                usd: "USD",
              }}
              onChange={actions.setUnit}
            />
          </div>
        )}
      </div>
    </ControlBarLayout>
  );
};
