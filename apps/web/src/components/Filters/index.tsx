import { useState } from "react";
import type { FC } from "react";
import { useRouter } from "next/router";
import type { DateValueType } from "react-tailwindcss-datepicker";

import { validateRange } from "~/utils/validators";
import { Button } from "~/components/Button";
import { useBreakpoint } from "~/hooks/useBreakpoint";
import type { Option } from "../Dropdown";
import type { NumberRange } from "../RangeInput";
import { BlockNumberFilter } from "./BlockNumberFilter";
import { RollupFilter } from "./RollupFilter";
import { SlotFilter } from "./SlotFilter";
import { TimestampFilter } from "./TimestampFilter";

const DEFAULT_MIN_VALUE = BigInt(0);
const DEFAULT_MAX_VALUE = BigInt(99999999);

const INIT_STATE: FiltersState = {
  rollup: null,
  timestampRange: {
    startDate: null,
    endDate: null,
  },
  blockNumberRange: [undefined, undefined],
  slotRange: [undefined, undefined],
};

interface FiltersErrorsState {
  blockNumberRange?: string;
  slotRange?: string;
}

interface FiltersState {
  rollup: Option | null;
  timestampRange: DateValueType;
  blockNumberRange: NumberRange;
  slotRange: NumberRange;
}

interface FiltersProps {
  enableSlotFilter?: boolean;
}

export const Filters: FC<FiltersProps> = function ({ enableSlotFilter }) {
  const [formData, setFormData] = useState<FiltersState>(INIT_STATE);
  const [errors, setErrors] = useState<FiltersErrorsState>({
    blockNumberRange: undefined,
  });

  const router = useRouter();

  const breakpoint = useBreakpoint();
  const fullWidth = breakpoint === "sm" || breakpoint === "default";

  const hasErrors = !!errors.blockNumberRange;
  const atLeastOneFilled =
    !!formData.rollup ||
    !!formData.timestampRange?.startDate ||
    !!formData.timestampRange?.endDate ||
    !!formData.blockNumberRange[0] ||
    !!formData.blockNumberRange[1] ||
    !!formData.slotRange[0] ||
    !!formData.slotRange[1];
  const allowToFilter = !hasErrors && atLeastOneFilled;

  if (!allowToFilter && Object.keys(router.query).length > 0) {
    router.replace(router.query, undefined, { shallow: true });
  }

  if (!allowToFilter && Object.keys(router.query).length > 0) {
    router.replace(router.query, undefined, { shallow: true });
  }

  const handleSubmit = () => {
    const { rollup, timestampRange, blockNumberRange, slotRange } = formData;
    const [startBlock, endBlock] = blockNumberRange;
    const [startSlot, endSlot] = slotRange;

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
        ...(startBlock && {
          ["start-block"]: startBlock.toString(),
        }),
        ...(endBlock && {
          ["end-block"]: endBlock.toString(),
        }),
        ...(startSlot && {
          ["start-slot"]: startSlot.toString(),
        }),
        ...(endSlot && {
          ["end-slot"]: endSlot.toString(),
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

  const handleBlockNumberRangeFilterChange = (newRange: NumberRange) => {
    const validatorMessage = validateRange(
      newRange,
      DEFAULT_MIN_VALUE,
      DEFAULT_MAX_VALUE
    );

    setErrors({
      blockNumberRange:
        validatorMessage.length > 0 ? validatorMessage : undefined,
    });

    setFormData((prevState) => ({ ...prevState, blockNumberRange: newRange }));
  };

  const handleSlotRangeFilterChange = (newRange: NumberRange) => {
    const validatorMessage = validateRange(
      newRange,
      DEFAULT_MIN_VALUE,
      DEFAULT_MAX_VALUE
    );

    setErrors({
      slotRange: validatorMessage.length > 0 ? validatorMessage : undefined,
    });

    setFormData((prevState) => ({ ...prevState, slotRange: newRange }));
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
            error={errors.blockNumberRange}
          />
          {enableSlotFilter && (
            <SlotFilter
              value={formData.slotRange}
              onChange={handleSlotRangeFilterChange}
              error={errors.slotRange}
            />
          )}
        </div>
        <div className="flex w-full flex-row gap-2 md:w-auto">
          <Button
            label="Clear"
            variant="outline"
            onClick={handleClear}
            disabled={!allowToFilter}
            fullWidth={fullWidth}
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
