import type { FC } from "react";
import { useEffect, useState } from "react";

import { getTimeFrameGranularities } from "@blobscan/api/src/time-frames";

import { useUrlState } from "~/hooks/useUrlState";
import { feeUnitParamsSchema } from "~/schemas/feeUnit";
import {
  DEFAULT_CHART_TIME_FRAME,
  getGranularityOption,
  getTimeFrameOption,
  GranularitySelector,
  RollupSelector,
  TimeFrameSelector,
} from "../Selectors";
import type { ChartTimeFrame } from "../Selectors";
import { CategorySelector } from "../Selectors/CategorySelector";
import { FeeUnitToggle } from "../Toggles";
import type { FeeUnit } from "../Toggles";
import { ControlBarLayout } from "./ControlBarLayout";
import { useControlState } from "./useControlState";

type TimeseriesControlBarProps = {
  /**
   * The chart splits its values by category and rollup, so the bar shows the
   * category and rollup filters. A chart with only global values does not
   * use them.
   */
  isCategorizedTimeseries?: boolean;
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
  isCategorizedTimeseries = false,
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

  const { options: granularities, default: defaultGranularity } =
    getTimeFrameGranularities(state.timeFrame, {
      isCategorized: isCategorizedTimeseries,
    });
  // The URL can have a granularity that the time frame does not allow.
  const granularity =
    state.granularity && granularities.includes(state.granularity)
      ? state.granularity
      : defaultGranularity;

  const handleTimeFrameChange = (timeFrame: ChartTimeFrame) => {
    const next = getTimeFrameGranularities(timeFrame, {
      isCategorized: isCategorizedTimeseries,
    });

    actions.setTimeFrame(timeFrame);

    // Keep the selected granularity when the new time frame allows it.
    // Otherwise, use the default granularity of the new time frame.
    if (
      state.granularity &&
      (!next.options.includes(state.granularity) ||
        state.granularity === next.default)
    ) {
      actions.setGranularity(null);
    }
  };

  const disableClear =
    !state.categories &&
    !state.rollups?.length &&
    state.timeFrame === DEFAULT_CHART_TIME_FRAME &&
    !state.granularity &&
    unit === "eth";

  return (
    <ControlBarLayout
      onApply={apply}
      onClear={() => {
        clear();
        setUnit("eth");
      }}
      disableClear={disableClear}
    >
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row lg:max-w-3xl lg:justify-start">
        {/* On small screens, the period selectors and the category and
            rollup filters have their own rows. */}
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
          <div className="flex shrink-0 flex-row gap-2">
            <div className="w-20 shrink-0 sm:w-24">
              <TimeFrameSelector
                selected={getTimeFrameOption(state.timeFrame)}
                onChange={(option) => handleTimeFrameChange(option.value)}
              />
            </div>

            <div className="min-w-0 flex-1 sm:w-28 sm:flex-none">
              <GranularitySelector
                granularities={granularities}
                selected={getGranularityOption(granularity)}
                onChange={({ value }) =>
                  actions.setGranularity(
                    value !== defaultGranularity ? value : null
                  )
                }
                disabled={granularities.length < 2}
              />
            </div>
          </div>

          {isCategorizedTimeseries && (
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
        </div>

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
