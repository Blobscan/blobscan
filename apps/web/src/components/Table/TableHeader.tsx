import type { FC } from "react";
import cn from "classnames";

import type { BaseTableCellElementProps, TableElementProps } from "./utils";
import { alignmentStyles, colSpan, sizeStyles, stickyStyles } from "./utils";

export type TableHeaderProps = TableElementProps & BaseTableCellElementProps;

export const TableHeader: FC<TableHeaderProps> = function ({
  alignment = "left",
  className,
  children,
  size = "md",
  variant = "normal",
  spanFullRow = false,
  sticky = false,
  colSpan: colSpanProp,
  ...props
}) {
  const variantStyles = cn({
    "dark:bg-transparent": variant === "transparent",
    "dark:bg-primary-900": variant === "normal",
    "dark:bg-surface-dark bg-surface-light": variant === "simple",
  });

  return (
    <th
      scope="col"
      className={`
        ${sizeStyles(size)}
        ${alignmentStyles(alignment)}
        ${variantStyles}
        ${stickyStyles(sticky)}
        z-9
        sticky
        top-0
        border-b
        border-border-light
        text-sm

        font-semibold        
        text-content-light
        dark:border-border-dark
        dark:bg-primary-900
        dark:text-content-dark
        ${className}
        `}
      colSpan={colSpan(spanFullRow, colSpanProp)}
      {...props}
    >
      {children}
    </th>
  );
};
