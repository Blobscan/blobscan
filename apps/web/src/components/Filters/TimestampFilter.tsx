import type { FC } from "react";
import type { DatepickerType } from "react-tailwindcss-datepicker";
import Datepicker from "react-tailwindcss-datepicker";

type RollupFilterProps = Pick<DatepickerType, "value" | "onChange">;

export const TimestampFilter: FC<RollupFilterProps> = function ({
  value,
  onChange,
}) {
  return (
    <div className="min-w-72 rounded-lg shadow-md">
      <Datepicker
        primaryColor="purple"
        value={value}
        onChange={onChange}
        containerClassName="relative tailwind-datepicker"
        placeholder="Start date - End date"
      />
    </div>
  );
};
