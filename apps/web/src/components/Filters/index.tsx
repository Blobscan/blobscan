import { useEffect, useReducer } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateRangeType } from "react-tailwindcss-datepicker";
import type { UrlObject } from "url";

import { Category } from "@blobscan/api/enums";

import { Button } from "~/components/Button";
import type { Sort } from "~/hooks/useQueryParams";
import { useQueryParams } from "~/hooks/useQueryParams";
import { capitalize, getISODate } from "~/utils";
import { Card } from "../Cards/Card";
import { Dropdown } from "../Dropdown";
import type { DropdownProps, Option } from "../Dropdown";
import type { NumberRange } from "../Inputs/NumberRangeInput";
import { BlockNumberFilter } from "./BlockNumberFilter";
import { ROLLUP_OPTIONS, RollupFilter } from "./RollupFilter";
import { SlotFilter } from "./SlotFilter";
import { SortToggle } from "./SortToggle";
import { TimestampFilter } from "./TimestampFilter";

const FROM_ADDRESSES_FORMAT_SEPARATOR = ",";

type FiltersState = {
  rollups: Option[] | null;
  category: Option | null;
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

const CATEGORY_FILTER_OPTIONS: DropdownProps["options"] = [
  { value: Category.OTHER.toLowerCase(), label: capitalize(Category.OTHER) },
  { value: Category.ROLLUP.toLowerCase(), label: capitalize(Category.ROLLUP) },
];

const INIT_STATE: FiltersState = {
  rollups: [],
  category: null,
  timestampRange: {
    endDate: null,
    startDate: null,
  },
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

export const Filters: FC = function () {
  const router = useRouter();
  const queryParams = useQueryParams();
  const [filters, dispatch] = useReducer(reducer, INIT_STATE);
  const disableClear =
    !filters.category &&
    !filters.rollups &&
    !filters.timestampRange?.endDate &&
    !filters.timestampRange?.startDate &&
    !filters.blockNumberRange &&
    !filters.slotRange &&
    !filters.sort;

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
      if (rollups.length === 1 && rollups[0]?.value === "null") {
        query.rollup = rollups[0]?.value;
      } else {
        query.from = rollups
          .map((r) => r.value)
          .join(FROM_ADDRESSES_FORMAT_SEPARATOR);
      }
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

  useEffect(() => {
    const { sort } = queryParams.paginationParams;
    const {
      rollup,
      from,
      startDate,
      endDate,
      startBlock,
      endBlock,
      startSlot,
      endSlot,
    } = queryParams.filterParams;
    const newFilters: Partial<FiltersState> = {};

    if (rollup || from) {
      const rollupOptions = ROLLUP_OPTIONS.filter((opt) => {
        const fromAddresses = from?.split(FROM_ADDRESSES_FORMAT_SEPARATOR);
        return (
          opt.value === rollup || fromAddresses?.includes(opt.value as string)
        );
      });

      if (rollupOptions) {
        newFilters.rollups = rollupOptions;
      }
    }

    if (startDate || endDate) {
      newFilters.timestampRange = {
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      };
    }

    if (startBlock || endBlock) {
      newFilters.blockNumberRange = {
        start: startBlock,
        end: endBlock,
      };
    }

    if (startSlot || endSlot) {
      newFilters.slotRange = {
        start: startSlot,
        end: endSlot,
      };
    }

    if (sort) {
      newFilters.sort = sort;
    }

    dispatch({ type: "UPDATE", payload: newFilters });
  }, [queryParams]);

  const handleCategoryChange = (newCategory: Option) => {
    dispatch({
      type: "UPDATE",
      payload: { category: newCategory },
    });

    if (newCategory?.value === Category.OTHER.toLowerCase()) {
      filters.rollups = [];
    }
  };

  return (
    <Card compact>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:gap-0">
        <div className="flex w-full flex-col items-center gap-2 md:flex-row">
          <div className="flex w-full flex-row gap-2 xl:w-auto">
            <SortToggle
              type={filters.sort}
              onChange={(newSort) => {
                dispatch({ type: "UPDATE", payload: { sort: newSort } });
              }}
            />
            <Dropdown
              options={CATEGORY_FILTER_OPTIONS}
              selected={filters.category}
              width="w-[6.5rem]"
              onChange={handleCategoryChange}
              placeholder="Category"
              clearable
            />
            <div className="w-full sm:w-full md:max-lg:w-full xl:w-[200px]">
              <RollupFilter
                selected={filters.rollups}
                isDisabled={
                  filters.category
                    ? filters.category.value.toString().toUpperCase() ===
                      Category.OTHER
                    : false
                }
                onChange={(newRollups) =>
                  dispatch({ type: "UPDATE", payload: { rollups: newRollups } })
                }
              />
            </div>
            <div className="w-[42px] sm:w-[222px] md:max-xl:w-[42px] xl:w-[222px]">
              <TimestampFilter
                value={filters.timestampRange}
                onChange={(newTimestampRange) =>
                  dispatch({
                    type: "UPDATE",
                    payload: { timestampRange: newTimestampRange },
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-full md:w-[11.5rem] lg:max-xl:w-[11.5rem] xl:w-[11.5rem]">
              <BlockNumberFilter
                range={filters.blockNumberRange}
                onChange={(newBlockNumberRange) =>
                  dispatch({
                    type: "UPDATE",
                    payload: { blockNumberRange: newBlockNumberRange },
                  })
                }
              />
            </div>
            <div className="w-full md:w-40 lg:max-xl:w-[10rem] xl:w-[10rem]">
              <SlotFilter
                range={filters.slotRange}
                onChange={(newSlotRange) =>
                  dispatch({
                    type: "UPDATE",
                    payload: { slotRange: newSlotRange },
                  })
                }
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row lg:ml-2">
          <Button
            className="w-full lg:w-auto lg:px-3 xl:px-6"
            variant="outline"
            onClick={() => dispatch({ type: "CLEAR" })}
            disabled={disableClear}
          >
            Clear
          </Button>
          <Button
            className="w-full lg:w-auto lg:px-3 xl:px-6"
            onClick={handleFilter}
          >
            Filter
          </Button>
        </div>
      </div>
    </Card>
  );
};
