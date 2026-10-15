import type { FC } from "react";

import { DatePicker } from "../DatePicker";
import { NumberRangeInput } from "../Inputs/NumberRangeInput";
import { RangeRadioGroup } from "../RangeRadioGroup";
import { RollupSelector } from "../Selectors";
import { CategorySelector } from "../Selectors/CategorySelector";
import { SortToggle } from "../Toggles";
import { ControlBarLayout } from "./ControlBarLayout";
import { useControlState } from "./useControlState";

const RANGE_LABEL: Record<"block" | "slot" | "epoch", string> = {
  block: "Block",
  slot: "Slot",
  epoch: "Epoch",
};

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

            {rangeType in RANGE_LABEL && (
              <NumberRangeInput
                className="w-full rounded-s-none"
                type="uint"
                inputStartProps={{
                  placeholder: `Start ${RANGE_LABEL[rangeType as keyof typeof RANGE_LABEL]}`,
                }}
                inputEndProps={{
                  placeholder: `End ${RANGE_LABEL[rangeType as keyof typeof RANGE_LABEL]}`,
                }}
                range={state.range.values as { start: number | null; end: number | null }}
                onChange={({ end = null, start = null }) =>
                  actions.setRange({
                    type: rangeType as "block" | "slot" | "epoch",
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
