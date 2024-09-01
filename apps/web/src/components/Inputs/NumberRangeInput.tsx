import type { InputProps } from "./Input";
import type { NumberInputType } from "./NumberInput";
import { NumericInput } from "./NumberInput";

export type NumberRange = {
  start?: number;
  end?: number;
};

export type NumberRangeInputProps = {
  range: NumberRange;
  type: NumberInputType;
  onChange: (range: NumberRange) => void;
  inputStartProps?: Omit<InputProps, "value" | "onChange" | "type">;
  inputEndProps?: Omit<InputProps, "value" | "onChange" | "type">;
};

export const NumberRangeInput: React.FC<NumberRangeInputProps> = ({
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
        className="h-full rounded-l-lg rounded-r-none border-r-controlBorder-light text-right text-sm dark:border-r-border-dark"
        onChange={(newStartValue) =>
          onChange({
            start: newStartValue,
            end: range.end,
          })
        }
        value={range.start}
        {...inputStartProps}
      />
      <NumericInput
        type={type}
        variant="filled"
        placeholder="End"
        className="h-full rounded-l-none rounded-r-lg text-sm"
        onChange={(newEndValue) =>
          onChange({
            start: range.start,
            end: newEndValue,
          })
        }
        value={range.end}
        {...inputEndProps}
      />
    </div>
  );
};
