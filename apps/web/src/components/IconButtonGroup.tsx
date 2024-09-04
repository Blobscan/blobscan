import type { FC, ReactNode } from "react";
import cn from "classnames";

import { IconButton, IconButtonProps } from "./IconButton";

export type Option = {
  value: string;
  icon: ReactNode;
};

export type IconButtonGroupProps = Pick<IconButtonProps, "variant" | "size"> & {
  options: Option[];
  selected: Option | null;
  onChange: (newOption: Option | null) => void;
};

const IconButtonGroup: FC<IconButtonGroupProps> = ({
  variant,
  size,
  options,
  selected,
  onChange,
}) => {
  return (
    <div className="isolate inline-flex rounded-md bg-controlBackground-light shadow-md dark:bg-controlBackground-dark">
      {options.map((opt) => {
        const isSelected = selected !== null && opt.value === selected.value;
        return (
          <div
            className={cn(
              "border-r border-r-controlBorder-light first-of-type:rounded-l-md last-of-type:rounded-r-md last-of-type:border-r-0 dark:border-r-border-dark",
              {
                "bg-primary-200 dark:bg-primary-700": isSelected,
              }
            )}
            key={opt.value}
          >
            <IconButton
              size={size}
              variant={variant}
              aria-pressed={isSelected}
              className="p-2"
              onClick={() => onChange(opt)}
            >
              {opt.icon}
            </IconButton>
          </div>
        );
      })}
    </div>
  );
};

export { IconButtonGroup };
