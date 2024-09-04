import type { FC } from "react";

import type { NumberRangeInputProps } from "../Inputs/NumberRangeInput";
import { NumberRangeInput } from "../Inputs/NumberRangeInput";

type BlockNumberFilterProps = Pick<NumberRangeInputProps, "range" | "onChange">;

export const BlockNumberFilter: FC<BlockNumberFilterProps> = function (props) {
  return (
    <NumberRangeInput
      className="w-full"
      type="uint"
      inputStartProps={{ placeholder: "Start Block" }}
      inputEndProps={{ placeholder: "End Block" }}
      {...props}
    />
  );
};
