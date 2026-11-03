import type { FC } from "react";
import { useEffect, useState } from "react";

import { useUrlState } from "~/hooks/useUrlState";
import { feeUnitParamsSchema } from "~/schemas/feeUnit";
import { RollupSelector } from "../Selectors";
import { CategorySelector } from "../Selectors/CategorySelector";
import { FeeUnitToggle } from "../Toggles";
import type { FeeUnit } from "../Toggles";
import { ControlBarLayout } from "./ControlBarLayout";
import { useControlState } from "./useControlState";

export type TimeseriesControlBarProps = {
  /**
   * Show the category and rollup filters.
   */
  showCategoryFilters?: boolean;
  /**
   * Show the USD/Ether toggle.
   */
  showFeeUnitToggle?: boolean;
  /**
   * The unit of the Ether values in the toggle (e.g. "Gwei").
   */
  etherUnit?: string;
};

export const TimeseriesControlBar: FC<TimeseriesControlBarProps> = ({
  showCategoryFilters = true,
  showFeeUnitToggle = false,
  etherUnit,
}) => {
  // Only this bar has the fee unit, thus it is not in useControlState.
  const { state: feeUnitParams } = useUrlState(feeUnitParamsSchema);
  const [unit, setUnit] = useState<FeeUnit>("eth");
  const { state, actions, apply, clear } = useControlState({
    unit: unit !== "eth" ? unit : undefined,
  });

  useEffect(() => {
    if (!feeUnitParams) return;
    setUnit(feeUnitParams.unit ?? "eth");
  }, [feeUnitParams]);

  const disableClear =
    !state.categories && !state.rollups?.length && unit === "eth";

  return (
    <ControlBarLayout
      onApply={apply}
      onClear={() => {
        clear();
        setUnit("eth");
      }}
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

        {showFeeUnitToggle && (
          <div className="w-full shrink-0 sm:w-36">
            <FeeUnitToggle
              variant="control"
              unit={unit}
              etherUnit={etherUnit}
              onChange={setUnit}
            />
          </div>
        )}
      </div>
    </ControlBarLayout>
  );
};
