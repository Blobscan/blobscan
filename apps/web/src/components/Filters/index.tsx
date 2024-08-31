import { useEffect, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateValueType } from "react-tailwindcss-datepicker";
import type { UrlObject } from "url";

import { Button } from "~/components/Button";
import { useQueryParams } from "~/hooks/useQueryParams";
import { getISODate } from "~/utils";
import type { Option } from "../Dropdown";
import type { NumberRange } from "../RangeInput";
import { BlockNumberFilter } from "./BlockNumberFilter";
import { ROLLUP_OPTIONS, RollupFilter } from "./RollupFilter";
import { TimestampFilter } from "./TimestampFilter";

type FiltersState = {
  rollup: Option | null;
  timestampRange: DateValueType;
  blockNumberRange: NumberRange;
};

const INIT_STATE: FiltersState = {
  rollup: null,
  timestampRange: {
    startDate: null,
    endDate: null,
  },
  blockNumberRange: [undefined, undefined],
};

export const Filters: FC = function () {
  const router = useRouter();
  const queryParams = useQueryParams();

  const [filters, setFilters] = useState<FiltersState>(INIT_STATE);
  const { blockNumberRange, rollup, timestampRange } = filters;
  const disableClear =
    !rollup &&
    !timestampRange?.startDate &&
    !timestampRange?.endDate &&
    !blockNumberRange[0] &&
    !blockNumberRange[1];

  const handleFilter = () => {
    const query: UrlObject["query"] = {};
    const { blockNumberRange, rollup, timestampRange } = filters;
    const { endDate, startDate } = timestampRange || {};
    const [startBlock, endBlock] = blockNumberRange;

    if (rollup) {
      if (rollup.value === "null") {
        query.rollup = rollup.value;
      } else {
        query.from = rollup.value;
      }
    }

    if (startDate) {
      query.startDate = getISODate(startDate);
    }

    if (endDate) {
      query.endDate = getISODate(endDate);
    }

    if (startBlock) {
      query.startBlock = startBlock.toString();
    }

    if (endBlock) {
      query.endBlock = endBlock.toString();
    }

    router.push({
      pathname: router.pathname,
      query,
    });
  };

  const handleClear = () => {
    setFilters(INIT_STATE);
  };

  const handleRollupFilterChange = (newRollup: Option) => {
    setFilters((prevState) => ({ ...prevState, rollup: newRollup }));
  };

  const handleTimestampRangeFilterChange = (newRange: DateValueType) => {
    setFilters((prevState) => ({ ...prevState, timestampRange: newRange }));
  };

  const handleBlockNumberRangeFilterChange = (newRange: NumberRange) => {
    setFilters((prevState) => ({ ...prevState, blockNumberRange: newRange }));
  };

  useEffect(() => {
    const { rollup, from, startDate, endDate, startBlock, endBlock } =
      queryParams;

    if (rollup || from) {
      const rollupOption = ROLLUP_OPTIONS.find(
        (opt) => opt.value === rollup || opt.value === from
      );

      if (rollupOption) {
        setFilters((prevFilters) => ({ ...prevFilters, rollup: rollupOption }));
      }
    }

    if (startDate || endDate) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        timestampRange: {
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
        },
      }));
    }

    if (startBlock || endBlock) {
      setFilters((prevFilters) => ({
        ...prevFilters,
        blockNumberRange: [
          startBlock ? BigInt(startBlock) : undefined,
          endBlock ? BigInt(endBlock) : undefined,
        ],
      }));
    }
  }, [queryParams]);

  return (
    <div className="flex w-full flex-col justify-between gap-2 rounded-lg bg-slate-50 p-2 dark:bg-primary-900 sm:flex-row">
      <div className="flex w-full flex-col items-center gap-2 md:flex-row">
        <RollupFilter
          selected={filters.rollup}
          onChange={handleRollupFilterChange}
        />
        <TimestampFilter
          value={filters.timestampRange}
          onChange={handleTimestampRangeFilterChange}
        />
        <BlockNumberFilter
          value={filters.blockNumberRange}
          onChange={handleBlockNumberRangeFilterChange}
        />
      </div>
      <div className="flex flex-row gap-2">
        <Button variant="outline" onClick={handleClear} disabled={disableClear}>
          Clear
        </Button>
        <Button onClick={handleFilter}>Filter</Button>
      </div>
    </div>
  );
};
