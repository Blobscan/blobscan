import { useEffect, useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateValueType } from "react-tailwindcss-datepicker";
import type { UrlObject } from "url";

import { Button } from "~/components/Button";
import { useQueryParams } from "~/hooks/useQueryParams";
import type { Option } from "../Dropdown";
import { ROLLUP_OPTIONS, RollupFilter } from "./RollupFilter";
import { TimestampFilter } from "./TimestampFilter";

type FiltersState = {
  rollup: Option | null;
  timestampRange: DateValueType | null;
};

const INIT_STATE: FiltersState = {
  rollup: null,
  timestampRange: {
    startDate: null,
    endDate: null,
  },
};

export const Filters: FC = function () {
  const router = useRouter();
  const queryParams = useQueryParams();

  const [filters, setFilters] = useState<FiltersState>(INIT_STATE);
  const disableClear =
    !filters.rollup &&
    !filters.timestampRange?.startDate &&
    !filters.timestampRange?.endDate;

  const handleFilter = () => {
    const query: UrlObject["query"] = {};
    const rollupFilter = filters.rollup;

    if (rollupFilter) {
      if (rollupFilter.value === "null") {
        query.rollup = rollupFilter.value;
      } else {
        query.from = rollupFilter.value;
      }
    }

    if (filters.timestampRange?.startDate) {
      query.startDate = filters.timestampRange.startDate.toString();
    }

    if (filters.timestampRange?.endDate) {
      query.endDate = filters.timestampRange.endDate.toString();
    }

    router.push({
      pathname: router.pathname,
      query,
    });
  };

  const handleClear = () => {
    router.push({ pathname: router.pathname, query: undefined });

    setFilters(INIT_STATE);
  };

  const handleRollupFilterChange = (newRollup: Option) => {
    setFilters((prevState) => ({ ...prevState, rollup: newRollup }));
  };

  const handleTimestampRangeFilterChange = (newRange: DateValueType) => {
    setFilters((prevState) => ({ ...prevState, timestampRange: newRange }));
  };

  useEffect(() => {
    if (queryParams.rollup || queryParams.from) {
      const rollupOption = ROLLUP_OPTIONS.find(
        (opt) =>
          opt.value === queryParams.rollup || opt.value === queryParams.from
      );

      if (rollupOption) {
        setFilters((prevFilters) => ({ ...prevFilters, rollup: rollupOption }));
      }

      if (queryParams.startDate || queryParams.endDate) {
        setFilters((prevFilters) => ({
          ...prevFilters,
          timestampRange: {
            startDate: queryParams.startDate
              ? new Date(queryParams.startDate)
              : null,
            endDate: queryParams.endDate ? new Date(queryParams.endDate) : null,
          },
        }));
      }
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
