import { useCallback, useEffect, useReducer } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateRangeType } from "react-tailwindcss-datepicker";
import type { UrlObject } from "url";

import { Button } from "~/components/Button";
import type { Sort } from "~/hooks/useQueryParams";
import {
  MULTIPLE_VALUES_SEPARATOR,
  useQueryParams,
} from "~/hooks/useQueryParams";
import { getISODate } from "~/utils";
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
  category: CategorySelectorOption | null;
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

const INIT_STATE: FiltersState = {
  rollups: [],
  category: null,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  range: RANGE_OPTIONS[1]!,
  timestampRange: null,
  blockNumberRange: null,
  slotRange: null,
  sort: "desc",
};

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

export const FiltersBar: FC = function () {
  const router = useRouter();
  const { filterParams, paginationParams } = useQueryParams();
  const [filters, dispatch] = useReducer(reducer, INIT_STATE);

  const disableClear =
    !filters.category &&
    !filters.rollups?.length &&
    !filters.range &&
    !filters.timestampRange &&
    !filters.blockNumberRange &&
    !filters.slotRange;

  const handleFilter = () => {
    const query: UrlObject["query"] = {};
    const {
      rollups,
      timestampRange,
      blockNumberRange,
      slotRange,
      sort,
      category,
    } = filters;

    if (rollups && rollups.length > 0) {
      query.rollups = rollups
        .flatMap((r) => r.value)
        .join(MULTIPLE_VALUES_SEPARATOR);
    }

    if (category) {
      query.category = category.value;
    }

    if (timestampRange) {
      const { startDate, endDate } = timestampRange;

      if (startDate) {
        query.startDate = getISODate(startDate);
      }

      if (endDate) {
        query.endDate = getISODate(endDate);
      }
    }

    if (blockNumberRange) {
      const { start, end } = blockNumberRange;

      if (start) {
        query.startBlock = start;
      }

      if (end) {
        query.endBlock = end;
      }
    }

    if (slotRange) {
      const { start, end } = slotRange;

      if (start) {
        query.startSlot = start;
      }

      if (end) {
        query.endSlot = end;
      }
    }

    if (sort) {
      query.sort = sort;
    }

    router.push({
      pathname: router.pathname,
      query,
    });
  };

  const handleRollupChange = useCallback(
    (newRollups: RollupSelectorOption[] | null) =>
      dispatch({
        type: "UPDATE",
        payload: { rollups: newRollups, category: CATEGORY_OPTIONS[1] },
      }),
    []
  );

  const handleCategoryChange = useCallback(
    (newCategory: CategorySelectorOption | null) => {
      const newFilters: Partial<FiltersState> = {
        category: newCategory,
      };

      if (newCategory?.value === "other") {
        newFilters.rollups = [];
      }

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
    const {
      category,
      startDate,
      endDate,
      startBlock,
      endBlock,
      startSlot,
      endSlot,
      rollups,
    } = filterParams;
    const { sort } = paginationParams;
    const newFilters: Partial<FiltersState> = {};

    if (category) {
      newFilters.category = CATEGORY_OPTIONS.find(
        (opts) => opts.value === category
      );
    }

    if (startDate || endDate) {
      newFilters.range = DATE_RANGE_OPTION;
      newFilters.timestampRange = {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      };
    }

    if (startBlock || endBlock) {
      newFilters.range = BLOCK_RANGE_OPTION;
      newFilters.blockNumberRange = {
        start: startBlock,
        end: endBlock,
      };
    }

    if (startSlot || endSlot) {
      newFilters.range = SLOT_RANGE_OPTION;
      newFilters.slotRange = {
        start: startSlot,
        end: endSlot,
      };
    }

    if (rollups?.length) {
      newFilters.rollups = rollups
        .map((r) => ROLLUP_OPTIONS.find((opts) => opts.value === r))
        .filter(Boolean) as RollupSelectorOption[];
    }

    if (sort) {
      newFilters.sort = sort;
    }

    dispatch({ type: "UPDATE", payload: newFilters });
  }, [filterParams, paginationParams]);

  return (
    <Card compact>
      <div className="flex  flex-col justify-between gap-5 lg:flex-row lg:justify-start lg:gap-0">
        <div className="flex w-full flex-col items-center gap-2 lg:flex-row lg:justify-start">
          <div className="flex w-full min-w-0 flex-row gap-2 lg:max-w-xl lg:justify-start">
            <div className="shrink-0">
              <SortToggle
                type={filters.sort}
                onChange={(newSort) => {
                  dispatch({ type: "UPDATE", payload: { sort: newSort } });
                }}
              />
            </div>
            <div className="w-28 shrink-0">
              <CategorySelector
                selected={filters.category}
                onChange={handleCategoryChange}
              />
            </div>

            <div className="min-w-0 flex-1 basis-0">
              <RollupSelector
                selected={filters.rollups}
                onChange={handleRollupChange}
              />
            </div>
          </div>
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
