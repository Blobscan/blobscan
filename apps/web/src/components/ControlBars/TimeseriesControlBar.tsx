import type { FC } from "react";

import {
  DEFAULT_CHART_TIME_FRAME,
  getTimeFrameOption,
  RollupSelector,
  TimeFrameSelector,
} from "../Selectors";
import { CategorySelector } from "../Selectors/CategorySelector";
import { ControlBarLayout } from "./ControlBarLayout";
import { useControlState } from "./useControlState";

type TimeseriesControlBarProps = {
  /**
   * The chart splits its values by category and rollup, so the bar shows the
   * category and rollup filters. A chart with only global values does not
   * use them.
   */
  isCategorizedTimeseries?: boolean;
};

export const TimeseriesControlBar: FC<TimeseriesControlBarProps> = ({
  isCategorizedTimeseries = false,
}) => {
  const { state, actions, apply, clear } = useControlState();

  const disableClear =
    !state.categories &&
    !state.rollups?.length &&
    state.timeFrame === DEFAULT_CHART_TIME_FRAME;

  return (
    <ControlBarLayout
      onApply={apply}
      onClear={clear}
      disableClear={disableClear}
    >
      <div className="flex w-full min-w-0 flex-row gap-2 lg:max-w-2xl lg:justify-start">
        <div className="w-20 shrink-0 sm:w-24">
          <TimeFrameSelector
            selected={getTimeFrameOption(state.timeFrame)}
            onChange={(option) => actions.setTimeFrame(option.value)}
          />
        </div>

        {isCategorizedTimeseries && (
          <>
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
          </>
        )}
      </div>
    </ControlBarLayout>
  );
};
