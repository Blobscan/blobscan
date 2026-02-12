import type { FC } from "react";

import { DatePicker } from "../DatePicker";
import { NumberRangeInput } from "../Inputs/NumberRangeInput";
import { RangeRadioGroup } from "../RangeRadioGroup";
import { RollupSelector } from "../Selectors";
import { CategorySelector } from "../Selectors/CategorySelector";
import { SortToggle } from "../Toggles";
import { ControlBarLayout } from "./ControlBarLayout";
import { useControlState } from "./useControlState";

export const ListControlBar: FC = () => {
  const { state, actions, apply, clear } = useControlState();

  const disableClear =
    !state.categories &&
    !state.rollups?.length &&
    !state.timestampRange &&
    !state.blockNumberRange &&
    !state.slotRange;

  return (
    <ControlBarLayout
      onApply={apply}
      onClear={clear}
      disableClear={disableClear}
    >
      <div className="flex w-full flex-col items-center gap-2 lg:flex-row lg:justify-start">
        <div className="flex w-full min-w-0 flex-row gap-2 lg:max-w-xl lg:justify-start">
          <div className="shrink-0">
            <SortToggle type={state.sort} onChange={actions.setSort} />
          </div>

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

        <div className="flex w-full justify-start lg:max-w-sm">
          <div className="w-28 border-r border-gray-200 dark:border-gray-500">
            <RangeRadioGroup
              selected={state.range}
              onChange={actions.setRange}
            />
          </div>

          <div className="min-w-0 flex-1 basis-0">
            {state.range?.value === "date" && (
              <DatePicker
                className="rounded-s-none"
                value={state.timestampRange}
                onChange={actions.setTimestampRange}
              />
            )}

            {state.range?.value === "block" && (
              <NumberRangeInput
                className="w-full rounded-s-none"
                type="uint"
                inputStartProps={{ placeholder: "Start Block" }}
                inputEndProps={{ placeholder: "End Block" }}
                range={state.blockNumberRange}
                onChange={actions.setBlockNumberRange}
              />
            )}

            {state.range?.value === "slot" && (
              <NumberRangeInput
                className="w-full rounded-s-none"
                type="uint"
                inputStartProps={{ placeholder: "Start Slot" }}
                inputEndProps={{ placeholder: "End Slot" }}
                range={state.slotRange}
                onChange={actions.setSlotRange}
              />
            )}
          </div>
        </div>
      </div>
    </ControlBarLayout>
  );
};
