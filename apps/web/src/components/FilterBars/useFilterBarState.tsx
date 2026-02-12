import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { DateRangeType } from "react-tailwindcss-datepicker";
import type { z } from "zod";

import { useUrlState } from "~/hooks/useUrlState";
import { filterParamsSchema } from "~/schemas/filters";
import type { Sort } from "~/schemas/sort";
import { sortParamsSchema } from "~/schemas/sort";
import type { NumberRange } from "../Inputs/NumberRangeInput";
import {
  BLOCK_RANGE_OPTION,
  DATE_RANGE_OPTION,
  RANGE_OPTIONS,
  SLOT_RANGE_OPTION,
} from "../RangeRadioGroup";
import type { RangeOption } from "../RangeRadioGroup";
import { ROLLUP_OPTIONS } from "../Selectors";
import type { RollupSelectorOption } from "../Selectors";
import { CATEGORY_OPTIONS } from "../Selectors/CategorySelector";
import type { CategorySelectorOption } from "../Selectors/CategorySelector";

type State = {
  rollups: RollupSelectorOption[] | null;
  categories: CategorySelectorOption | null;
  range: RangeOption;
  timestampRange: DateRangeType | null;
  blockNumberRange: NumberRange | null;
  slotRange: NumberRange | null;
  sort: Sort;
};

type Action = { type: "CLEAR" } | { type: "UPDATE"; payload: Partial<State> };

export const filterAndSortParamsSchema =
  filterParamsSchema.merge(sortParamsSchema);
type FilterAndSortParams = z.infer<typeof filterAndSortParamsSchema>;

const INITIAL_STATE: State = {
  rollups: [],
  categories: null,
  range: RANGE_OPTIONS[1],
  timestampRange: null,
  blockNumberRange: null,
  slotRange: null,
  sort: "desc",
};

function toState(queryParams: FilterAndSortParams): Partial<State> {
  const {
    categories,
    startDate,
    endDate,
    startBlock,
    endBlock,
    startSlot,
    endSlot,
    rollups,
    sort,
  } = queryParams;

  const next: Partial<State> = {};

  if (categories) {
    next.categories =
      CATEGORY_OPTIONS.find((o) => categories.includes(o.value)) ?? null;
  }

  if (startDate || endDate) {
    next.range = DATE_RANGE_OPTION;
    next.timestampRange = {
      startDate: startDate ?? null,
      endDate: endDate ?? null,
    };
  }

  if (startBlock || endBlock) {
    next.range = BLOCK_RANGE_OPTION;
    next.blockNumberRange = { start: startBlock, end: endBlock };
  }

  if (startSlot || endSlot) {
    next.range = SLOT_RANGE_OPTION;
    next.slotRange = { start: startSlot, end: endSlot };
  }

  if (rollups?.length) {
    next.rollups = rollups
      .map((r) => ROLLUP_OPTIONS.find((o) => o.value === r))
      .filter(Boolean) as RollupSelectorOption[];
  }

  if (sort) next.sort = sort;

  return next;
}

function reducer(prev: State, action: Action): State {
  switch (action.type) {
    case "CLEAR":
      return { ...INITIAL_STATE };
    case "UPDATE":
      return { ...prev, ...action.payload };
  }
}

export function useFilterBarState() {
  const { state: urlParams, updateState } = useUrlState(
    filterAndSortParamsSchema
  );
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    if (!urlParams) return;
    dispatch({ type: "UPDATE", payload: toState(urlParams) });
  }, [urlParams]);

  const disableClear = useMemo(() => {
    return (
      !state.categories &&
      !state.rollups?.length &&
      !state.timestampRange &&
      !state.blockNumberRange &&
      !state.slotRange
    );
  }, [state]);

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const apply = useCallback(() => {
    const {
      rollups,
      timestampRange,
      blockNumberRange,
      slotRange,
      sort,
      categories,
    } = state;

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
      rollups: rollups?.length ? rollups.map((r) => r.value) : undefined,
      startDate,
      endDate,
      startBlock: blockNumberRange?.start,
      endBlock: blockNumberRange?.end,
      startSlot: slotRange?.start,
      endSlot: slotRange?.end,
      sort,
    });
  }, [state, updateState]);

  const actions = useMemo(
    () => ({
      setRollups: (rollups: RollupSelectorOption[] | null) =>
        dispatch({ type: "UPDATE", payload: { rollups } }),

      setCategory: (categories: CategorySelectorOption | null) =>
        dispatch({ type: "UPDATE", payload: { categories } }),

      setSort: (sort: Sort) => dispatch({ type: "UPDATE", payload: { sort } }),

      setRange: (range: RangeOption) => {
        const payload: Partial<State> = { range };

        switch (range?.value) {
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
      },

      setTimestampRange: (timestampRange: DateRangeType | null) =>
        dispatch({ type: "UPDATE", payload: { timestampRange } }),

      setBlockNumberRange: (blockNumberRange: NumberRange | null) =>
        dispatch({ type: "UPDATE", payload: { blockNumberRange } }),

      setSlotRange: (slotRange: NumberRange | null) =>
        dispatch({ type: "UPDATE", payload: { slotRange } }),
    }),
    []
  );

  return { state, actions, apply, clear, disableClear };
}
