import { useCallback, useEffect, useMemo, useReducer } from "react";
import type { DateType } from "react-tailwindcss-datepicker";
import type { z } from "zod";

import { useUrlState } from "~/hooks/useUrlState";
import { filterParamsSchema } from "~/schemas/filters";
import type { Sort } from "~/schemas/sort";
import { sortParamsSchema } from "~/schemas/sort";
import type { Range } from "../RangeRadioGroup";
import { ROLLUP_OPTIONS } from "../Selectors";
import type { RollupSelectorOption } from "../Selectors";
import { CATEGORY_OPTIONS } from "../Selectors/CategorySelector";
import type { CategorySelectorOption } from "../Selectors/CategorySelector";

type RangeValue<T> = {
  end: T | null;
  start: T | null;
};

type RangeFilterBase<T extends Range, U> = {
  type: T;
  values: RangeValue<U>;
};

type RangeFilter =
  | RangeFilterBase<"block" | "slot", number>
  | RangeFilterBase<"date", DateType>;

type ControlState = {
  rollups: RollupSelectorOption[] | null;
  categories: CategorySelectorOption | null;
  range: RangeFilter;

  sort: Sort;
};

type Action =
  | { type: "CLEAR" }
  | { type: "UPDATE"; payload: Partial<ControlState> };

export const controlParamsSchema = filterParamsSchema.merge(sortParamsSchema);

type ControlParams = z.infer<typeof controlParamsSchema>;

const INITIAL_STATE: ControlState = {
  rollups: [],
  categories: null,
  range: {
    type: "date",
    values: {
      start: null,
      end: null,
    },
  },
  sort: "desc",
};

function toControlState(queryParams: ControlParams): Partial<ControlState> {
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

  const next: Partial<ControlState> = {};

  if (categories) {
    next.categories =
      CATEGORY_OPTIONS.find((o) => categories.includes(o.value)) ?? null;
  }

  if (rollups?.length) {
    next.rollups = rollups
      .map((r) => ROLLUP_OPTIONS.find((o) => o.value === r))
      .filter(Boolean) as RollupSelectorOption[];
  }

  if (sort) next.sort = sort;

  if (startDate || endDate) {
    next.range = {
      type: "date",
      values: {
        start: startDate ?? null,
        end: endDate ?? null,
      },
    };
  } else if (startBlock || endBlock) {
    next.range = {
      type: "block",
      values: {
        end: endBlock ?? null,
        start: startBlock ?? null,
      },
    };
  } else if (startSlot || endSlot) {
    next.range = {
      type: "slot",
      values: {
        start: startSlot ?? null,
        end: endSlot ?? null,
      },
    };
  }

  return next;
}

function reducer(prev: ControlState, action: Action): ControlState {
  switch (action.type) {
    case "CLEAR":
      return { ...INITIAL_STATE };
    case "UPDATE":
      return { ...prev, ...action.payload };
  }
}

export function useControlState() {
  const { state: urlParams, updateState } = useUrlState(controlParamsSchema);
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  useEffect(() => {
    if (!urlParams) return;
    dispatch({ type: "UPDATE", payload: toControlState(urlParams) });
  }, [urlParams]);

  const clear = useCallback(() => dispatch({ type: "CLEAR" }), []);

  const apply = useCallback(() => {
    const { rollups, range, sort, categories } = state;

    const newUrlState: ControlParams = {
      sort,
    };

    if (categories) {
      newUrlState.categories = [categories.value];
    }

    if (rollups?.length) {
      newUrlState.rollups = rollups.map((r) => r.value);
    }

    const clearedRange: ControlParams = {
      startBlock: undefined,
      endBlock: undefined,
      startSlot: undefined,
      endSlot: undefined,
      startDate: undefined,
      endDate: undefined,
    };

    if (range) {
      const { type, values } = range;

      if (type === "block") {
        clearedRange.startBlock = values.start ?? undefined;
        clearedRange.endBlock = values.end ?? undefined;
      } else if (type === "date") {
        const start = values.start;
        const end = values.end;

        clearedRange.startDate =
          typeof start === "string" ? new Date(start) : start ?? undefined;
        clearedRange.endDate =
          typeof end === "string" ? new Date(end) : end ?? undefined;
      } else if (type === "slot") {
        clearedRange.startSlot = values.start ?? undefined;
        clearedRange.endSlot = values.end ?? undefined;
      }
    }

    Object.assign(newUrlState, clearedRange);

    updateState(newUrlState);
  }, [state, updateState]);

  const actions = useMemo(
    () => ({
      setRollups: (rollups: RollupSelectorOption[] | null) =>
        dispatch({ type: "UPDATE", payload: { rollups } }),

      setCategory: (categories: CategorySelectorOption | null) =>
        dispatch({ type: "UPDATE", payload: { categories } }),

      setSort: (sort: Sort) => dispatch({ type: "UPDATE", payload: { sort } }),

      setRange: (range: RangeFilter) =>
        dispatch({ type: "UPDATE", payload: { range } }),
    }),
    []
  );

  return { state, actions, apply, clear };
}
