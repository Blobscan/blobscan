import { Fragment } from "react";
import type { FC, ReactNode } from "react";
import cn from "classnames";

import type { Size } from "~/types";
import { TableCell } from "./TableCell";
import type { TableCellProps } from "./TableCell";
import { TableHeader } from "./TableHeader";
import type { TableHeaderProps } from "./TableHeader";
import { ExpandableTableRow, TableRow } from "./TableRow";
import type { Alignment, Variant } from "./utils";

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
  variant?: Variant;
  fixedColumnsWidth?: boolean;
};

export const Table: FC<TableProps> = function ({
  alignment = "left",
  size = "md",
  variant = "normal",
  className,
  expandableRowsMode,
  headers,
  rows,
  fixedColumnsWidth = false,
}) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
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
                                <TableHeader className="sr-only" />
                              )}
                              <TableHeader
                                className={`${generalHeaderStyles} ${specificHeaderStyles} truncate`}
                                alignment={alignment}
                                size={size}
                                spanFullRow={spanFullRow}
                                sticky={sticky}
                                variant={variant}
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
                      ({ item, spanFullRow, sticky, ...props }, i) => (
                        <TableCell
                          key={i}
                          alignment={alignment}
                          size={size}
                          variant={variant}
                          spanFullRow={spanFullRow}
                          sticky={sticky}
                          className={`${generalRowClassName} ${
                            expandableRowsMode ? "border-none" : ""
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
