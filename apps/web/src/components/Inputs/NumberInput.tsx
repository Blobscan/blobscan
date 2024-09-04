import { useEffect, useState } from "react";
import type { ChangeEventHandler, FC } from "react";

import { Input } from "./Input";
import type { InputProps } from "./Input";

export type NumberInputType = "int" | "uint" | "decimal";

export type NumberInputProps = Omit<
  InputProps,
  "value" | "onChange" | "type"
> & {
  type?: NumberInputType;
  value?: number;
  onChange(value?: number): void;
};

export const NumericInput: FC<NumberInputProps> = function ({
  value: valueProp = "",
  type = "int",
  onChange,
  ...props
}) {
  const [innerValue, setInnerValue] = useState(valueProp.toString());

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = ({
    target: { value: newValue },
  }) => {
    if (!newValue.length) {
      setInnerValue("");
      onChange();

      return;
    }

    // Prevent multiple minus signs
    const minusIndex = newValue.indexOf("-");

    if (minusIndex > -1) {
      const minusCount = newValue.match(/-/g)?.length;

      if (minusCount) {
        if (minusCount === 1 && newValue.length === 1) {
          if (type !== "uint") {
            setInnerValue(newValue);
          }
          return;
        }

        if (minusCount > 1) {
          return;
        }
      }
    }

    const newValueNumber = Number(newValue);

    if (type === "decimal" && !isNaN(newValueNumber)) {
      return;
    } else {
      if (!Number.isInteger(newValueNumber) || newValue.indexOf(".") > -1) {
        return;
      }

      if (type === "uint" && newValueNumber < 0) {
        return;
      }
    }

    setInnerValue(newValue);
    onChange(newValueNumber);
  };

  useEffect(() => {
    setInnerValue(valueProp.toString());
  }, [valueProp]);

  return <Input onChange={handleInputChange} value={innerValue} {...props} />;
};
