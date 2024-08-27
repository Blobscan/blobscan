import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateValueType } from "react-tailwindcss-datepicker";

import { Button } from "~/components/Button";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { Option } from "../Dropdown";
import type { NumberRange } from "../RangeInput";
import { BlockNumberFilter } from "./BlockNumberFilter";
import { RollupFilter } from "./RollupFilter";
import { TimestampFilter } from "./TimestampFilter";

const INIT_STATE: FiltersState = {
  rollup: null,
  timestampRange: {
    startDate: null,
    endDate: null,
  },
  blockNumberRange: [undefined, undefined],
};

interface FiltersState {
  rollup: Option | null;
  timestampRange: DateValueType;
  blockNumberRange: NumberRange;
}

export const Filters: FC = function () {
  const [formData, setFormData] = useState<FiltersState>(INIT_STATE);
  const router = useRouter();

  const breakpoint = useBreakpoint();
  const fullWidth = breakpoint === "sm" || breakpoint === "default";

  const allowToFilter =
    !!formData.rollup ||
    !!formData.timestampRange?.startDate ||
    !!formData.timestampRange?.endDate ||
    !!formData.blockNumberRange[0] ||
    !!formData.blockNumberRange[1];

  if (!allowToFilter && Object.keys(router.query).length > 0) {
    router.replace(router.query, undefined, { shallow: true });
  }

  const handleSubmit = () => {
    const { rollup, timestampRange, blockNumberRange } = formData;
    const [startBlock, endBlock] = blockNumberRange;
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        ...(rollup?.value && { rollup: rollup.value }),
        ...(timestampRange?.startDate && {
          ["start-date"]: timestampRange.startDate as string,
        }),
        ...(timestampRange?.endDate && {
          ["end-date"]: timestampRange.endDate as string,
        }),
        ...(startBlock && {
          ["start-block"]: startBlock.toString(),
        }),
        ...(endBlock && {
          ["end-block"]: endBlock.toString(),
        }),
      },
    });
  };

  const handleRollupFilterChange = (newRollup: Option) => {
    setFormData((prevState) => ({ ...prevState, rollup: newRollup }));
  };

  const handleTimestampRangeFilterChange = (newRange: DateValueType) => {
    setFormData((prevState) => ({ ...prevState, timestampRange: newRange }));
  };

  const handleBlockNumberRangeFilterChange = (newRange: NumberRange) => {
    setFormData((prevState) => ({ ...prevState, blockNumberRange: newRange }));
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
          <BlockNumberFilter
            value={formData.blockNumberRange}
            onChange={handleBlockNumberRangeFilterChange}
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
