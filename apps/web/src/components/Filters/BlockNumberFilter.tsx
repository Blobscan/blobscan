import type { FC } from "react";

import type { NumberRangeInputProps } from "../Inputs/NumberRangeInput";
import { NumberRangeInput } from "../Inputs/NumberRangeInput";

type BlockNumberFilterProps = Pick<NumberRangeInputProps, "range" | "onChange">;

export const BlockNumberFilter: FC<BlockNumberFilterProps> = function (props) {
  return (
    <div className="w-full lg:w-52">
      <NumberRangeInput
        type="uint"
        inputStartProps={{ placeholder: "Start Block" }}
        inputEndProps={{ placeholder: "End Block" }}
        {...props}
      />
    </div>
  );
};
