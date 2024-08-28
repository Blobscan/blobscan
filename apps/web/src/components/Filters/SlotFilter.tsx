import type { FC } from "react";

import type { RangeInputProps } from "../RangeInput";
import { RangeInput } from "../RangeInput";

type SlotFilterProps = RangeInputProps & Pick<RangeInputProps, "value">;

export const SlotFilter: FC<SlotFilterProps> = function (props) {
  return (
    <div className="w-full lg:w-[240px]">
      <RangeInput
        {...props}
        startPlaceholder="Start slot"
        endPlaceholder="End slot"
      />
    </div>
  );
};
