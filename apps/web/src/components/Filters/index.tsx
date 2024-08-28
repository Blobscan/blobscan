import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateValueType } from "react-tailwindcss-datepicker";

import { Button } from "~/components/Button";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { Option } from "../Dropdown";
import { RollupFilter } from "./RollupFilter";
import { TimestampFilter } from "./TimestampFilter";

const INIT_STATE = {
  rollup: null,
  timestampRange: {
    startDate: null,
    endDate: null,
  },
};

interface FiltersState {
  rollup: Option | null;
  timestampRange: DateValueType;
}

export const Filters: FC = function () {
  const [formData, setFormData] = useState<FiltersState>(INIT_STATE);
  const router = useRouter();

  const breakpoint = useBreakpoint();
  const fullWidth = breakpoint === "sm" || breakpoint === "default";

  const allowToFilter =
    !!formData.rollup ||
    !!formData.timestampRange?.startDate ||
    !!formData.timestampRange?.endDate;

  if (!allowToFilter && Object.keys(router.query).length > 0) {
    router.replace(router.query, undefined, { shallow: true });
  }

  const handleSubmit = () => {
    const { rollup, timestampRange } = formData;
    router.push({
      pathname: router.pathname,
      query: {
        ...(rollup?.value && { rollup: rollup.value }),
        ...(timestampRange?.startDate && {
          ["start-date"]: timestampRange.startDate as string,
        }),
        ...(timestampRange?.endDate && {
          ["end-date"]: timestampRange.endDate as string,
        }),
      },
    });
  };

  const handleClear = () => {
    router.push({ pathname: router.pathname, query: undefined });
    setFormData(INIT_STATE);
  };

  const handleRollupFilterChange = (newRollup: Option) => {
    setFormData((prevState) => ({ ...prevState, rollup: newRollup }));
  };

  const handleTimestampRangeFilterChange = (newRange: DateValueType) => {
    setFormData((prevState) => ({ ...prevState, timestampRange: newRange }));
  };

  return (
    <form
      className="flex flex-col justify-between gap-3 rounded-lg bg-slate-50 p-2 dark:bg-primary-900 sm:flex-row"
      onSubmit={handleSubmit}
    >
      <div className="flex w-full flex-col items-center justify-between gap-2 md:flex-row">
        <div className="flex w-full flex-col justify-start gap-2 md:flex-row">
          <RollupFilter
            selected={formData.rollup}
            onChange={handleRollupFilterChange}
            fullWidth={fullWidth}
          />
          <TimestampFilter
            value={formData.timestampRange}
            onChange={handleTimestampRangeFilterChange}
          />
        </div>
        <div className="flex flex-row gap-2">
          <Button
            label="Clear"
            variant="outline"
            onClick={handleClear}
            disabled={!allowToFilter}
          />
          <Button
            label="Filter"
            onClick={handleSubmit}
            disabled={!allowToFilter}
            fullWidth={fullWidth}
          />
        </div>
      </div>
    </form>
  );
};
