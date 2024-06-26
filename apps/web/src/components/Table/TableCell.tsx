import type { FC } from "react";

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
      className={`
      ${sizeStyles(size)}
      ${alignmentStyles(alignment)}
      ${colSpan(spanFullRow, colSpanProp)}
      whitespace-nowrap
      border-b
      border-border-light/50
      text-sm
      text-contentSecondary-light
      dark:border-border-dark/50
      dark:text-contentSecondary-dark
      ${className}
    `}
      {...props}
    >
      {children}
    </td>
  );
};
