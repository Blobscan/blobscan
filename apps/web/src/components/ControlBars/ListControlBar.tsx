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
  const rangeType = state.range.type;

  const disableClear =
    !state.categories && !state.rollups?.length && !state.range;

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
              selected={state.range.type}
              onChange={(newRange) =>
                actions.setRange({
                  type: newRange,
                  values: {
                    start: null,
                    end: null,
                  },
                })
              }
            />
          </div>

          <div className="min-w-0 flex-1 basis-0">
            {rangeType === "date" && (
              <DatePicker
                className="rounded-s-none"
                value={{
                  startDate: state.range.values?.start,
                  endDate: state.range.values?.end,
                }}
                onChange={(newDateRange) =>
                  actions.setRange({
                    type: "date",
                    values: {
                      end: newDateRange?.endDate ?? null,
                      start: newDateRange?.startDate ?? null,
                    },
                  })
                }
              />
            )}

            {(rangeType === "block" || rangeType === "slot") && (
              <NumberRangeInput
                className="w-full rounded-s-none"
                type="uint"
                inputStartProps={{
                  placeholder: `Start ${
                    rangeType === "block" ? "Block" : "Slot"
                  }`,
                }}
                inputEndProps={{
                  placeholder: `End ${
                    rangeType === "block" ? "Block" : "Slot"
                  }`,
                }}
                range={state.range.values}
                onChange={({ end = null, start = null }) =>
                  actions.setRange({
                    type: rangeType,
                    values: {
                      end,
                      start,
                    },
                  })
                }
              />
            )}
          </div>
        </div>
      </div>
    </ControlBarLayout>
  );
};
