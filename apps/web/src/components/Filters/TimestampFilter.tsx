import type { FC } from "react";
import cn from "classnames";
import type { DatepickerType } from "react-tailwindcss-datepicker";
import Datepicker from "react-tailwindcss-datepicker";

type TimestampFilterProps = Pick<DatepickerType, "value" | "onChange">;

export const TimestampFilter: FC<TimestampFilterProps> = function ({
  value,
  onChange,
}) {
  const isValueSet = value?.startDate || value?.endDate;

  return (
    <Datepicker
      primaryColor="purple"
      value={value}
      onChange={onChange}
      inputClassName={cn(
        "h-9 w-full pl-2 pr-12",
        "text-left text-sm placeholder:text-sm",
        "cursor-pointer",
        "rounded-lg border border-transparent shadow-md",
        "dark:placeholder:text-hint-dark placeholder:text-hint-light hover:border hover:border-controlBackground-light dark:hover:border-controlBorderHighlight-dark",
        "focus:outline-none focus-visible:border-indigo-500  focus:border-controlBorderHighlight-dark",
        "ui-open:border-controlActive-light dark:ui-open:border-controlActive-dark",
        "bg-controlBackground-light dark:bg-controlBackground-dark",
        "active:border-controlBorderHighlight-dark",
        "focus:dark:border-controlBorderHighlight-dark  focus:ring-transparent"
      )}
      toggleClassName={(defaultToggleClassName) =>
        cn(defaultToggleClassName, "text-icon-light  dark:text-icon-dark", {
          "hover:text-iconHighlight-light hover:opacity-100 dark:hover:text-iconHighlight-dark":
            isValueSet,
        })
      }
      containerClassName={cn(
        "relative",
        "[&>div>div]:dark:bg-controlBackground-dark [&>div>div]:border-controlBorder-light [&>div>div]:dark:border-transparent"
      )}
      placeholder="Start date - End date"
    />
  );
};
