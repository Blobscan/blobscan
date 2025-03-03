import { useCallback } from "react";
import type { FC, ReactNode } from "react";
import { useRouter } from "next/router";
import Skeleton from "react-loading-skeleton";

import { Card } from "~/components/Cards/Card";
import { Dropdown } from "~/components/Dropdown";
import type { DropdownProps, Option } from "~/components/Dropdown";
import type { PaginationProps } from "~/components/Pagination";
import { Pagination } from "~/components/Pagination";
import type { TableProps } from "~/components/Table";
import { Table } from "~/components/Table";
import type { Rollup } from "~/types";

const DEFAULT_TABLE_EMPTY_STATE = "No items";
const PAGE_SIZES_OPTIONS: DropdownProps["options"] = [
  { value: 10 },
  { value: 25 },
  { value: 50 },
  { value: 100 },
];
const DEFAULT_ROW_SKELETON_HEIGHT = 22;

export interface PaginatedTableQueryFilters {
  rollup: Rollup;
  startDate: Date;
  endDate: Date;
}

type PaginationData = {
  page: number;
  pageSize: number;
};

export type PaginatedTableProps = {
  isLoading: boolean;
  totalItems?: number;
  isExpandable?: boolean;
  paginationData: PaginationData;
  rowSkeletonHeight?: string | number;
  tableTopSlot?: ReactNode;
} & Pick<TableProps, "headers" | "rows">;

const getRowsSkeleton = (
  cellsNumber = 0,
  isExpandable: boolean,
  height: PaginatedTableProps["rowSkeletonHeight"]
) => {
  return Array.from({ length: 10 }).map((_) => ({
    cells: Array.from({
      length: isExpandable ? cellsNumber + 1 : cellsNumber,
    }).map((_, i) => ({
      item: <Skeleton key={i} height={height} width={"100%"} />,
    })),
  }));
};

export const PaginatedTable: FC<PaginatedTableProps> = function ({
  isLoading,
  headers,
  rows,
  totalItems,
  paginationData,
  isExpandable = false,
  rowSkeletonHeight = DEFAULT_ROW_SKELETON_HEIGHT,
}) {
  const { page, pageSize } = paginationData;

  const router = useRouter();
  const pages =
    totalItems !== undefined
      ? totalItems === 0
        ? 1
        : Math.ceil(totalItems / pageSize)
      : undefined;

  const handlePageSizeSelection = useCallback<DropdownProps["onChange"]>(
    (option: Option) => {
      if (!option) {
        return;
      }

      const newPageSize = option.value as number;

      void router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          /**
           * Update the selected page to a lower value if we require fewer pages to show the
           * new amount of elements per page.
           */
          p: Math.min(
            Math.ceil(totalItems ?? 0 / (newPageSize as number)),
            page
          ),
          ps: newPageSize,
        },
      });
    },
    [page, totalItems, router]
  );

  const handlePageSelection = useCallback<PaginationProps["onChange"]>(
    (newPage) =>
      void router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          p: newPage,
          ps: pageSize,
        },
      }),
    [pageSize, router]
  );

  return (
    <Card
      header={
        <div className={`flex flex-col justify-end md:flex-row`}>
          <div className="w-full self-center sm:w-auto">
            <Pagination
              selected={page}
              pages={pages}
              onChange={handlePageSelection}
            />
          </div>
        </div>
      }
      emptyState={DEFAULT_TABLE_EMPTY_STATE}
      compact
    >
      <div className="flex flex-col gap-6">
        <Table
          fixedColumnsWidth={true}
          expandableRowsMode={isExpandable}
          headers={headers}
          rows={
            isLoading
              ? getRowsSkeleton(
                  headers?.[0]?.cells.length,
                  isExpandable,
                  rowSkeletonHeight
                )
              : rows
          }
        />
        <div className="flex w-full flex-col items-center gap-3 text-sm md:flex-row md:justify-between">
          <div className="flex items-center justify-start gap-2">
            Displayed items:
            <Dropdown
              options={PAGE_SIZES_OPTIONS}
              selected={{ value: pageSize }}
              width="w-full"
              onChange={handlePageSizeSelection}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Pagination
              selected={page}
              pages={pages}
              inverseCompact
              onChange={handlePageSelection}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
