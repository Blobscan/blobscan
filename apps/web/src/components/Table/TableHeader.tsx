import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import type { BaseTableCellElementProps, TableElementProps } from "./utils";
import { alignmentStyles, colSpan, sizeStyles, stickyStyles } from "./utils";

export type TableHeaderProps = TableElementProps & BaseTableCellElementProps;

export const TableHeader: FC<TableHeaderProps> = function ({
  alignment = "left",
  className,
  children,
  size = "md",
  spanFullRow = false,
  sticky = false,
  colSpan: colSpanProp,
  ...props
}) {
  return (
    <th
      scope="col"
      className={twMerge(
        `
        ${sizeStyles(size)}
        ${alignmentStyles(alignment)}
        ${stickyStyles(sticky)}
        z-9
        sticky
        top-0
        w-full
        border-b
        border-border-light
        text-sm
        font-semibold
        text-content-light
        first-of-type:rounded-tl-sm        
        last-of-type:rounded-tr-sm
        dark:border-border-dark
        dark:bg-primary-800
        dark:text-content-dark
        `,
        className
      )}
      colSpan={colSpan(spanFullRow, colSpanProp)}
      {...props}
    >
      {children}
    </th>
  );
};
