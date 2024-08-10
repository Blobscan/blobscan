import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateValueType } from "react-tailwindcss-datepicker";

import { Button } from "~/components/Button";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { Option } from "../Dropdown";
import { RollupFilter } from "./RollupFilter";
import { TimestampFilter } from "./TimestampFilter";

interface FiltersState {
  rollup: Option | null;
  timestampRange: DateValueType;
}

export const Filters: FC = function () {
  const [formData, setFormData] = useState<FiltersState>({
    rollup: null,
    timestampRange: {
      startDate: null,
      endDate: null,
    },
  });
  const router = useRouter();

  const breakpoint = useBreakpoint();
  const fullWidth = breakpoint === "sm" || breakpoint === "default";

  const allowToFilter =
    !!formData.rollup &&
    !!formData.timestampRange?.startDate &&
    !!formData.timestampRange?.endDate;

  const handleSubmit = () => {
    if (formData.rollup && !!formData.timestampRange) {
      router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          rollup: formData.rollup.value,
          startDate: formData.timestampRange.startDate as string,
          endDate: formData.timestampRange.endDate as string,
        },
      });
    }
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
        <Button
          label="Filter"
          onClick={handleSubmit}
          disabled={!allowToFilter}
          fullWidth={fullWidth}
        />
      </div>
    </form>
  );
};
