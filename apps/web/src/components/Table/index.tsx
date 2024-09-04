import { Fragment } from "react";
import type { FC, ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import cn from "classnames";
import { twMerge } from "tailwind-merge";

import type { Size } from "~/types";
import { TableCell } from "./TableCell";
import type { TableCellProps } from "./TableCell";
import { TableHeader } from "./TableHeader";
import type { TableHeaderProps } from "./TableHeader";
import { ExpandableTableRow, TableRow } from "./TableRow";
import type { Alignment } from "./utils";

const tableVariants = cva("px-4 sm:px-6 lg:px-8", {
  variants: {
    variant: {
      outline: `
          border
          border-border-light
          dark:border-border-dark
          rounded-lg
        `,
    },
  },
});

type HeaderCell = {
  item: ReactNode;
} & TableHeaderProps;

type RowCell = {
  item: ReactNode;
} & TableCellProps;

export type TableHeader = {
  cells: HeaderCell[];
  sticky?: boolean;
  spanFullRow?: boolean;
  className?: string;
};

export type TableRow = {
  cells: RowCell[];
  expandItem?: ReactNode;
  sticky?: boolean;
  spanFullRow?: boolean;
  className?: string;
};

export type TableProps = {
  expandableRowsMode?: boolean;
  headers?: TableHeader[];
  rows?: TableRow[];
  className?: string;
  size?: Size;
  alignment?: Alignment;
  fixedColumnsWidth?: boolean;
} & VariantProps<typeof tableVariants>;

export const Table: FC<TableProps> = function ({
  variant,
  alignment = "left",
  size = "md",
  className,
  expandableRowsMode,
  headers,
  rows,
  fixedColumnsWidth = false,
}) {
  return (
    <div className={twMerge(tableVariants({ variant }))}>
      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div
            className={`inline-block min-w-full py-2 align-middle ${className}`}
          >
            <table
              className={cn("w-full border-separate border-spacing-0 rounded", {
                "table-fixed": fixedColumnsWidth,
              })}
            >
              {headers && (
                <thead>
                  {headers.map(
                    (
                      {
                        cells,
                        sticky,
                        spanFullRow,
                        className: generalHeaderStyles,
                      },
                      i
                    ) => (
                      <TableRow key={i}>
                        {cells.map(
                          (
                            { item, className: specificHeaderStyles, ...props },
                            i
                          ) => (
                            <Fragment key={i}>
                              {Boolean(expandableRowsMode && i === 0) && (
                                <TableHeader className="sr-only w-12" />
                              )}
                              <TableHeader
                                className={twMerge(
                                  generalHeaderStyles,
                                  specificHeaderStyles
                                )}
                                alignment={alignment}
                                size={size}
                                spanFullRow={spanFullRow}
                                sticky={sticky}
                                {...props}
                              >
                                {item}
                              </TableHeader>
                            </Fragment>
                          )
                        )}
                      </TableRow>
                    )
                  )}
                </thead>
              )}
              <tbody>
                {rows?.map(
                  (
                    { cells, expandItem, className: generalRowClassName },
                    i
                  ) => {
                    const tableCells = cells.map(
                      (
                        {
                          item,
                          spanFullRow,
                          sticky,
                          className: specificClassName,
                          ...props
                        },
                        i
                      ) => (
                        <TableCell
                          key={i}
                          alignment={alignment}
                          size={size}
                          spanFullRow={spanFullRow}
                          sticky={sticky}
                          className={`${generalRowClassName} ${specificClassName} ${
                            expandableRowsMode
                              ? expandItem
                                ? "border-none"
                                : "border-b dark:border-border-dark/40"
                              : ""
                          } truncate`}
                          {...props}
                        >
                          {item}
                        </TableCell>
                      )
                    );

                    return expandableRowsMode ? (
                      <ExpandableTableRow key={i} expandItem={expandItem}>
                        {tableCells}
                      </ExpandableTableRow>
                    ) : (
                      <TableRow key={i}>{tableCells}</TableRow>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
