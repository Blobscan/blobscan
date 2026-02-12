import type { FC } from "react";

import { RollupSelector } from "../Selectors";
import { CategorySelector } from "../Selectors/CategorySelector";
import { FilterBarLayout } from "./FilterBarLayout";
import { useFilterBarState } from "./useFilterBarState";

export const TimeseriesFilterBar: FC = () => {
  const { state, actions, apply, clear, disableClear } = useFilterBarState();

  return (
    <FilterBarLayout
      onApply={apply}
      onClear={clear}
      disableClear={disableClear}
    >
      <div className="flex w-full min-w-0 flex-row gap-2 lg:max-w-xl lg:justify-start">
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
    </FilterBarLayout>
  );
};
