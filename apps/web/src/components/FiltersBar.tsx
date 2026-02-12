import { useCallback, useEffect, useReducer } from "react";
import type { FC } from "react";
import type { DateRangeType } from "react-tailwindcss-datepicker";
import type { z } from "zod";

import { Button } from "~/components/Button";
import { useUrlState } from "~/hooks/useUrlState";
import { filterParamsSchema } from "~/schemas/filters";
import type { Sort } from "~/schemas/sort";
import { sortParamsSchema } from "~/schemas/sort";
import { Card } from "./Cards/Card";
import { DatePicker } from "./DatePicker";
import { NumberRangeInput } from "./Inputs/NumberRangeInput";
import type { NumberRange } from "./Inputs/NumberRangeInput";
import {
  BLOCK_RANGE_OPTION,
  DATE_RANGE_OPTION,
  RANGE_OPTIONS,
  RangeRadioGroup,
  SLOT_RANGE_OPTION,
} from "./RangeRadioGroup";
import type { RangeOption } from "./RangeRadioGroup";
import { ROLLUP_OPTIONS, RollupSelector } from "./Selectors";
import type { RollupSelectorOption } from "./Selectors";
import {
  CATEGORY_OPTIONS,
  CategorySelector,
} from "./Selectors/CategorySelector";
import type { CategorySelectorOption } from "./Selectors/CategorySelector";
import { SortToggle } from "./Toggles";

type FiltersState = {
  rollups: RollupSelectorOption[] | null;
  categories: CategorySelectorOption | null;
  range: RangeOption;
  timestampRange: DateRangeType | null;
  blockNumberRange: NumberRange | null;
  slotRange: NumberRange | null;
  sort: Sort;
};

type ClearAction<V extends keyof FiltersState> = {
  type: "CLEAR";
  payload?: { field: V };
};

type UpdateAction = {
  type: "UPDATE";
  payload: Partial<FiltersState>;
};

type FiltersAction<V extends keyof FiltersState> =
  | ClearAction<V>
  | UpdateAction;

const filterSortSchema = filterParamsSchema.merge(sortParamsSchema);

type FilterUrlParams = z.infer<typeof filterSortSchema>;

const INIT_STATE: FiltersState = {
  rollups: [],
  categories: null,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range: RANGE_OPTIONS[1]!,
  timestampRange: null,
  blockNumberRange: null,
  slotRange: null,
  sort: "desc",
};

function toFiltersState({
  categories,
  startDate,
  endDate,
  startBlock,
  endBlock,
  startSlot,
  endSlot,
  rollups,
  sort,
}: FilterUrlParams) {
  const newFiltersState: Partial<FiltersState> = {};

  if (categories) {
    newFiltersState.categories = CATEGORY_OPTIONS.find((opts) =>
      categories.includes(opts.value)
    );
  }

  if (startDate || endDate) {
    newFiltersState.range = DATE_RANGE_OPTION;
    newFiltersState.timestampRange = {
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    };
  }

  if (startBlock || endBlock) {
    newFiltersState.range = BLOCK_RANGE_OPTION;
    newFiltersState.blockNumberRange = {
      start: startBlock,
      end: endBlock,
    };
  }

  if (startSlot || endSlot) {
    newFiltersState.range = SLOT_RANGE_OPTION;
    newFiltersState.slotRange = {
      start: startSlot,
      end: endSlot,
    };
  }

  if (rollups?.length) {
    newFiltersState.rollups = rollups
      .map((r) => ROLLUP_OPTIONS.find((opts) => opts.value === r))
      .filter(Boolean) as RollupSelectorOption[];
  }

  if (sort) {
    newFiltersState.sort = sort;
  }

  return newFiltersState;
}

function reducer<V extends keyof FiltersState>(
  prevState: FiltersState,
  { type, payload }: FiltersAction<V>
): FiltersState {
  switch (type) {
    case "CLEAR":
      return payload
        ? {
            ...prevState,
            [payload.field]: null,
          }
        : { ...INIT_STATE };
    case "UPDATE":
      return {
        ...prevState,
        ...payload,
      };
  }
}

export type FiltersBarProps = {
  hideCategoryFilter?: boolean;
  hideRollupFilter?: boolean;
  hideRangeFilter?: boolean;
  hideSortFilter?: boolean;
};

export const FiltersBar: FC<FiltersBarProps> = function ({
  hideCategoryFilter,
  hideRollupFilter,
  hideRangeFilter,
  hideSortFilter,
}) {
  const { state: urlParams, updateState } = useUrlState(filterSortSchema);
  const [filters, dispatch] = useReducer(reducer, INIT_STATE);

  const disableClear =
    !filters.categories &&
    !filters.rollups?.length &&
    !filters.range &&
    !filters.timestampRange &&
    !filters.blockNumberRange &&
    !filters.slotRange;

  const handleFilter = () => {
    const {
      rollups,
      timestampRange,
      blockNumberRange,
      slotRange,
      sort,
      categories,
    } = filters;

    const startDate =
      typeof timestampRange?.startDate === "string"
        ? new Date(timestampRange.startDate)
        : undefined;
    const endDate =
      typeof timestampRange?.endDate === "string"
        ? new Date(timestampRange.endDate)
        : undefined;

    updateState({
      categories: categories ? [categories.value] : undefined,
      rollups: rollups?.length ? rollups.flatMap((r) => r.value) : undefined,
      startDate,
      endDate,
      startBlock: blockNumberRange?.start,
      endBlock: blockNumberRange?.end,
      startSlot: slotRange?.start,
      endSlot: slotRange?.end,
      sort,
    });
  };

  const handleRollupChange = useCallback(
    (newRollups: RollupSelectorOption[] | null) =>
      dispatch({
        type: "UPDATE",
        payload: { rollups: newRollups },
      }),
    []
  );

  const handleCategoryChange = useCallback(
    (newCategory: CategorySelectorOption | null) => {
      const newFilters: Partial<FiltersState> = {
        categories: newCategory,
      };

      dispatch({
        type: "UPDATE",
        payload: newFilters,
      });
    },
    []
  );

  const handleRangeChange = useCallback((newRange: RangeOption) => {
    const payload: Partial<FiltersState> = { range: newRange };

    switch (newRange?.value) {
      case "date":
        payload.slotRange = null;
        payload.blockNumberRange = null;
        break;
      case "block":
        payload.slotRange = null;
        payload.timestampRange = null;
        break;
      case "slot":
        payload.blockNumberRange = null;
        payload.timestampRange = null;
        break;
      default:
        payload.blockNumberRange = null;
        payload.slotRange = null;
        payload.timestampRange = null;
        break;
    }

    dispatch({ type: "UPDATE", payload });
  }, []);

  useEffect(() => {
    if (!urlParams) return;

    const newFilters = toFiltersState(urlParams);

    dispatch({ type: "UPDATE", payload: newFilters });
  }, [urlParams]);

  return (
    <Card compact>
      <div className="flex  flex-col justify-between gap-5 lg:flex-row lg:justify-start lg:gap-0">
        <div className="flex w-full flex-col items-center gap-2 lg:flex-row lg:justify-start">
          <div className="flex w-full min-w-0 flex-row gap-2 lg:max-w-xl lg:justify-start">
            {!hideSortFilter && (
              <div className="shrink-0">
                <SortToggle
                  type={filters.sort}
                  onChange={(newSort) => {
                    dispatch({ type: "UPDATE", payload: { sort: newSort } });
                  }}
                />
              </div>
            )}
            {!hideCategoryFilter && (
              <div className="w-28 shrink-0">
                <CategorySelector
                  selected={filters.categories}
                  onChange={handleCategoryChange}
                />
              </div>
            )}

            {!hideRollupFilter && (
              <div className="min-w-0 flex-1 basis-0">
                <RollupSelector
                  selected={filters.rollups}
                  onChange={handleRollupChange}
                />
              </div>
            )}
          </div>
          {!hideRangeFilter && (
            <div className="flex w-full justify-start lg:max-w-sm">
              <div className="w-28 border-r border-gray-200 dark:border-gray-500">
                <RangeRadioGroup
                  selected={filters.range}
                  onChange={handleRangeChange}
                />
              </div>
              <div className="min-w-0 flex-1 basis-0">
                {filters.range?.value === "date" && (
                  <DatePicker
                    className="rounded-s-none"
                    value={filters.timestampRange}
                    onChange={(newTimestampRange) =>
                      dispatch({
                        type: "UPDATE",
                        payload: { timestampRange: newTimestampRange },
                      })
                    }
                  />
                )}
                {filters.range?.value === "block" && (
                  <NumberRangeInput
                    className="w-full rounded-s-none"
                    type="uint"
                    inputStartProps={{ placeholder: "Start Block" }}
                    inputEndProps={{ placeholder: "End Block" }}
                    range={filters.blockNumberRange}
                    onChange={(newBlockNumberRange) =>
                      dispatch({
                        type: "UPDATE",
                        payload: { blockNumberRange: newBlockNumberRange },
                      })
                    }
                  />
                )}
                {filters.range?.value === "slot" && (
                  <NumberRangeInput
                    className="w-full rounded-s-none"
                    type="uint"
                    inputStartProps={{ placeholder: "Start Slot" }}
                    inputEndProps={{ placeholder: "End Slot" }}
                    range={filters.slotRange}
                    onChange={(newSlotRange) =>
                      dispatch({
                        type: "UPDATE",
                        payload: { slotRange: newSlotRange },
                      })
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 md:flex-row lg:ml-2">
          <Button
            className="w-full  lg:px-3 xl:px-6"
            variant="outline"
            onClick={() => dispatch({ type: "CLEAR" })}
            disabled={disableClear}
          >
            Clear
          </Button>
          <Button className="w-full  lg:px-3 xl:px-6" onClick={handleFilter}>
            Filter
          </Button>
        </div>
      </div>
    </Card>
  );
};
