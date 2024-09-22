import type { FC } from "react";
import { twMerge } from "tailwind-merge";

import { colSpan } from "./utils";
import type { BaseTableCellElementProps, TableElementProps } from "./utils";
import { alignmentStyles, sizeStyles } from "./utils";

export type TableCellProps = TableElementProps & BaseTableCellElementProps;

export const TableCell: FC<TableCellProps> = function ({
  alignment = "left",
  size = "md",
  spanFullRow = false,
  colSpan: colSpanProp,
  children,
  className,
  ...props
}) {
  return (
    <td
      className={twMerge(
        sizeStyles(size),
        alignmentStyles(alignment),
        `
        truncate
        whitespace-nowrap
        border-b
        border-border-light/50
        text-sm
        text-contentSecondary-light
        dark:border-border-dark/50
        dark:text-contentSecondary-dark
        `,
        className
      )}
      colSpan={colSpan(spanFullRow, colSpanProp)}
      {...props}
    >
      {children}
    </td>
  );
};
