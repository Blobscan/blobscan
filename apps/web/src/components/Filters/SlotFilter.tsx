import type { FC } from "react";

import type { NumberRangeInputProps } from "../Inputs/NumberRangeInput";
import { NumberRangeInput } from "../Inputs/NumberRangeInput";

type SlotFilterProps = Pick<NumberRangeInputProps, "range" | "onChange">;

export const SlotFilter: FC<SlotFilterProps> = function (props) {
  return (
    <NumberRangeInput
      className="w-full"
      type="uint"
      inputStartProps={{ placeholder: "Start Slot" }}
      inputEndProps={{ placeholder: "End Slot" }}
      {...props}
    />
  );
};
