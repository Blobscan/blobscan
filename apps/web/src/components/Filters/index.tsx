import { useEffect, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateValueType } from "react-tailwindcss-datepicker";
import type { UrlObject } from "url";

import { Button } from "~/components/Button";
import { useQueryParams } from "~/hooks/useQueryParams";
import { getISODate } from "~/utils";
import { Card } from "../Cards/Card";
import type { Option } from "../Dropdown";
import type { NumberRange } from "../Inputs/NumberRangeInput";
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
  blockNumberRange: {
    end: undefined,
    start: undefined,
  },
};

export const Filters: FC = function () {
  const router = useRouter();
  const queryParams = useQueryParams();

  const [filters, setFilters] = useState<FiltersState>(INIT_STATE);
  const { blockNumberRange, rollup, timestampRange } = filters;
  const { startDate, endDate } = timestampRange || {};
  const { start: startBlock, end: endBlock } = blockNumberRange;
  const disableClear =
    !rollup && !startDate && !endDate && !startBlock && !endBlock;

  const handleFilter = () => {
    const query: UrlObject["query"] = {};
    const { rollup, timestampRange } = filters;
    const { endDate, startDate } = timestampRange || {};

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
      query.startBlock = startBlock;
    }

    if (endBlock) {
      query.endBlock = endBlock;
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
        blockNumberRange: {
          end: endBlock,
          start: startBlock,
        },
      }));
    }
  }, [queryParams]);

  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:gap-0">
        <div className="flex w-full flex-col items-center gap-2 md:flex-row">
          <div className="w-full md:w-40">
            <RollupFilter
              selected={filters.rollup}
              onChange={handleRollupFilterChange}
            />
          </div>
          <div className="w-full md:w-64">
            <TimestampFilter
              value={filters.timestampRange}
              onChange={handleTimestampRangeFilterChange}
            />
          </div>
          <div className="w-full md:w-52">
            <BlockNumberFilter
              range={filters.blockNumberRange}
              onChange={handleBlockNumberRangeFilterChange}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Button
            className="w-full lg:w-auto"
            variant="outline"
            onClick={handleClear}
            disabled={disableClear}
          >
            Clear
          </Button>
          <Button className="w-full lg:w-auto" onClick={handleFilter}>
            Filter
          </Button>
        </div>
      </div>
    </Card>
  );
};
