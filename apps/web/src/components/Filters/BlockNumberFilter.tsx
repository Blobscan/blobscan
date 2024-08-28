import type { FC } from "react";

import type { RangeInputProps } from "../RangeInput";
import { RangeInput } from "../RangeInput";

type BlockNumberFilterProps = RangeInputProps & Pick<RangeInputProps, "value">;

export const BlockNumberFilter: FC<BlockNumberFilterProps> = function (props) {
  return (
    <div className="w-full md:w-[240px]">
      <RangeInput {...props} />
    </div>
  );
};
