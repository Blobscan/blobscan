import type { FC } from "react";
import cn from "classnames";
import type { DatepickerType } from "react-tailwindcss-datepicker";
import Datepicker from "react-tailwindcss-datepicker";

type RollupFilterProps = Pick<DatepickerType, "value" | "onChange">;

export const TimestampFilter: FC<RollupFilterProps> = function ({
  value,
  onChange,
}) {
  const isValueSet = value?.startDate || value?.endDate;

  return (
    <div className="min-w-64">
      <Datepicker
        primaryColor="purple"
        value={value}
        onChange={onChange}
        inputClassName={cn(
          "h-9 w-full pl-2 pr-12",
          "text-left text-sm",
          "cursor-pointer",
          "rounded-lg border border-transparent shadow-md",
          "hover:border hover:border-controlBackground-light dark:hover:border-controlBorderHighlight-dark",
          "focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white",
          "ui-open:border-controlActive-light dark:ui-open:border-controlActive-dark",
          "bg-controlBackground-light dark:bg-controlBackground-dark",
          "active:border-controlBorderHighlight-dark"
        )}
        toggleClassName={(defaultToggleClassName) =>
          cn(
            defaultToggleClassName,
            "opacity-60",
            "text-contentTertiary-light  dark:text-contentTertiary-dark",
            {
              "hover:text-iconHighlight-light hover:opacity-100 dark:hover:text-iconHighlight-dark":
                isValueSet,
            }
          )
        }
        containerClassName="relative tailwind-datepicker"
        placeholder="Start date - End date"
      />
    </div>
  );
};
