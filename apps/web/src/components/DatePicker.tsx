import type { FC } from "react";
import cn from "classnames";
import type { DatepickerType } from "react-tailwindcss-datepicker";
import TailwindDatePicker from "react-tailwindcss-datepicker";
import { twMerge } from "tailwind-merge";

type DatePickerProps = Pick<DatepickerType, "value" | "onChange"> & {
  className?: string;
};

export const DatePicker: FC<DatePickerProps> = function ({
  value,
  onChange,
  className,
}) {
  const isValueSet = value?.startDate || value?.endDate;

  return (
    <TailwindDatePicker
      primaryColor="purple"
      value={value}
      onChange={onChange}
      inputClassName={twMerge(
        cn(
          "h-9 w-full",
          "text-left text-sm placeholder:text-sm",
          "cursor-pointer",
          "rounded-lg border border-transparent shadow-md",
          "dark:placeholder:text-hint-dark placeholder:text-hint-light hover:border hover:border-controlBorderHighlight-light dark:hover:border-controlBorderHighlight-dark",
          "focus:outline-none focus-visible:border-indigo-500  focus:border-controlBorderHighlight-dark",
          "ui-open:border-controlActive-light dark:ui-open:border-controlActive-dark",
          "bg-controlBackground-light dark:bg-controlBackground-dark",
          "active:border-controlBorderHighlight-dark",
          "focus:dark:border-controlBorderHighlight-dark  focus:ring-transparent"
        ),
        className
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
      placeholder={"Start date - End date"}
    />
  );
};
