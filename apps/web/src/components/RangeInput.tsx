import { useState } from "react";

import { validateRange } from "~/utils/validators";
import { Input } from "./Input";

const DEFAULT_MIN_VALUE = BigInt(0);
const DEFAULT_MAX_VALUE = BigInt(99999999);

export type NumberRange = [bigint | undefined, bigint | undefined];

export type RangeInputProps = {
  value: NumberRange;
  onChange: (range: NumberRange) => void;
  minValue?: bigint;
  maxValue?: bigint;
};

export const RangeInput: React.FC<RangeInputProps> = ({
  value,
  minValue = DEFAULT_MIN_VALUE,
  maxValue = DEFAULT_MAX_VALUE,
  onChange,
}) => {
  const [range, setRange] = useState<NumberRange>(value);
  const [error, setError] = useState<string>("");

  const handleChange = (newRange: NumberRange) => {
    const validatorMessage = validateRange(range, minValue, maxValue);
    setError(validatorMessage);

    if (validatorMessage.length === 0) {
      onChange(newRange);
    }
  };

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = BigInt(e.target.value) || undefined;
    const newRange = [newStart, range[1]] as NumberRange;
    setRange(newRange);
    handleChange(newRange);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = BigInt(e.target.value) || undefined;
    const newRange = [range[0], newEnd] as NumberRange;
    setRange(newRange);
    handleChange(newRange);
  };

  return (
    <div className="flex flex-col">
      <div className="range-input flex flex-row">
        <Input
          placeholder="Start block"
          className="h-[42px]"
          value={range[0] ? range[0]?.toString() : undefined}
          type="number"
          onChange={handleStartChange}
        />
        <Input
          placeholder="End block"
          className="h-[42px]"
          value={range[1]?.toString()}
          type="number"
          onChange={handleEndChange}
        />
      </div>
      {error.length > 0 && (
        <span className="dark:text-error-30 ml-2 mt-1 text-xs text-error-600 dark:text-error-300">
          {error}
        </span>
      )}
    </div>
  );
};
