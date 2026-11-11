import { useCallback } from "react";
import type { FC, ReactNode } from "react";
import { useRouter } from "next/compat/router";
import Skeleton from "react-loading-skeleton";

import { Card } from "~/components/Cards/Card";
import type { PaginationProps } from "~/components/Pagination";
import { Pagination } from "~/components/Pagination";
import type { TableProps } from "~/components/Table";
import { Table } from "~/components/Table";
import type { Rollup } from "~/types";
import { EmptyState } from "../EmptyState";
import { PageSizeSelector } from "../Selectors/PageSizeSelector";
import type { PageSizeOption } from "../Selectors/PageSizeSelector";

const DEFAULT_ROW_SKELETON_HEIGHT = 22;

export interface PaginatedTableQueryFilters {
  rollup: Rollup;
  startDate: Date;
  endDate: Date;
}

type PaginationData = {
  p?: number;
  ps?: number;
};

export type PaginatedTableProps = {
  title?: ReactNode;
  emptyStateDescription?: string;
  isLoading: boolean;
  totalItems?: number;
  isExpandable?: boolean;
  paginationData?: PaginationData;
  rowSkeletonHeight?: string | number;
  tableTopSlot?: ReactNode;
  tableClassName?: TableProps["className"];
} & Pick<TableProps, "headers" | "rows">;

const getRowsSkeleton = (
  cellsNumber = 0,
  height: PaginatedTableProps["rowSkeletonHeight"]
) => {
  return Array.from({ length: 10 }).map((_) => ({
    cells: Array.from({
      length: cellsNumber,
    }).map((_, i) => ({
      item: <Skeleton key={i} height={height} width={"100%"} />,
    })),
  }));
};

export const PaginatedTable: FC<PaginatedTableProps> = function ({
  title,
  isLoading,
  headers,
  rows,
  totalItems,
  paginationData,
  emptyStateDescription,
  isExpandable = false,
  rowSkeletonHeight = DEFAULT_ROW_SKELETON_HEIGHT,
  tableClassName,
}) {
  const { p = 1, ps = 50 } = paginationData || {};
  const isEmpty = !isLoading && !rows?.length;

  const router = useRouter();
  const pages =
    totalItems !== undefined
      ? totalItems === 0
        ? 1
        : Math.ceil(totalItems / ps)
      : undefined;

  const handlePageSizeSelection = useCallback(
    ({ value: newPageSize }: PageSizeOption) => {
      if (!router) {
        return;
      }

      const { p: _, ...rest } = router.query;

      void router.push({
        pathname: router.pathname,
        query: {
          ...rest,
          ps: newPageSize,
        },
      });
    },
    [router]
  );

  const handlePageSelection = useCallback<PaginationProps["onChange"]>(
    (newPage) => {
      if (!router) {
        return;
      }

      void router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          p: newPage,
          ps,
        },
      });
    },
    [ps, router]
  );

  return (
    <Card
      className="min-w-0"
      header={
        isEmpty && !title ? null : (
          <div
            className={`flex flex-wrap items-center gap-3 ${
              title ? "justify-between" : "justify-end"
            }`}
          >
            {title && <div className="min-w-0">{title}</div>}
            {!isEmpty && (
              <div className="w-full self-center sm:w-auto">
                <Pagination
                  selected={p}
                  pages={pages}
                  onChange={handlePageSelection}
                />
              </div>
            )}
          </div>
        )
      }
      compact
    >
      {isEmpty ? (
        <div className="h-[400px] sm:h-[500px]">
          <EmptyState size="lg" description={emptyStateDescription} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Table
            className={tableClassName}
            expandableRowsMode={isExpandable}
            headers={headers}
            rows={
              isLoading
                ? getRowsSkeleton(headers?.[0]?.cells.length, rowSkeletonHeight)
                : rows
            }
            fixedColumnsWidth
            revealRows={!isLoading}
          />
          <div className="flex w-full flex-col items-center gap-3 text-sm md:flex-row md:justify-between">
            <div className="flex items-center justify-start gap-2">
              Displayed items:
              <PageSizeSelector
                selected={{ value: ps }}
                onChange={handlePageSizeSelection}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Pagination
                selected={p}
                pages={pages}
                inverseCompact
                onChange={handlePageSelection}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
