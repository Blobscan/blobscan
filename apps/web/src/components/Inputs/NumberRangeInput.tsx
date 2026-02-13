import type { InputHTMLAttributes } from "react";

import type { InputProps } from "./Input";
import type { NumberInputType } from "./NumberInput";
import { NumericInput } from "./NumberInput";

type SingleInput = Omit<InputProps, "value" | "onChange" | "type">;

export type NumberRange = {
  start?: number | null;
  end?: number | null;
};

export type NumberRangeInputProps = {
  className?: InputHTMLAttributes<HTMLInputElement>["className"];
  range: NumberRange | null;
  type: NumberInputType;
  onChange: (range: NumberRange) => void;
  inputStartProps?: SingleInput;
  inputEndProps?: SingleInput;
};

export const NumberRangeInput: React.FC<NumberRangeInputProps> = ({
  className,
  range,
  type,
  inputEndProps = {},
  inputStartProps = {},
  onChange,
}) => {
  return (
    <div className="flex h-9">
      <NumericInput
        type={type}
        variant="filled"
        placeholder="Start"
        className={`rounded-l-lg rounded-r-none border-r-controlBorder-light text-sm dark:border-r-border-dark ${className}`}
        onChange={(newStartValue) =>
          onChange({
            start: newStartValue,
            end: range?.end,
          })
        }
        value={range?.start ?? undefined}
        {...inputStartProps}
      />
      <NumericInput
        type={type}
        variant="filled"
        placeholder="End"
        className={`rounded-l-none rounded-r-lg text-sm ${className}`}
        onChange={(newEndValue) =>
          onChange({
            start: range?.start,
            end: newEndValue,
          })
        }
        value={range?.end ?? undefined}
        {...inputEndProps}
      />
    </div>
  );
};
