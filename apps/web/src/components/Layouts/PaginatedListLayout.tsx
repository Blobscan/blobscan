import { Fragment, useCallback, type FC, type ReactNode } from "react";
import { useRouter } from "next/router";

import { Header } from "~/components/Header";
import { Card } from "../Cards/Card";
import { Dropdown, type DropdownProps } from "../Dropdown";
import { Pagination, type PaginationProps } from "../Pagination";

export type PaginatedListLayoutProps = {
  header?: ReactNode;
  title?: ReactNode;
  items?: ReactNode[];
  totalItems?: number;
  page: number;
  pageSize: number;
  itemSkeleton: ReactNode;
};

const PAGE_SIZES = [10, 25, 50, 100];

export const PaginatedListLayout: FC<PaginatedListLayoutProps> = function ({
  header,
  title,
  items,
  totalItems,
  page,
  pageSize,
  itemSkeleton,
}) {
  const router = useRouter();
  const pages = totalItems ? Math.ceil(totalItems / pageSize) : undefined;
  const hasItems = !items || items.length;

  const handlePageSizeSelection = useCallback<DropdownProps["onChange"]>(
    (newPageSize: number) =>
      void router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          /**
           * Update the selected page to a lower value if we require less pages to show the
           * new amount of elements per page.
           */
          p: Math.min(Math.ceil(totalItems ?? 0 / newPageSize), page),
          ps: newPageSize,
        },
      }),
    [page, totalItems, router],
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
    [pageSize, router],
  );

  return (
    <>
      <Header>{header}</Header>
      <Card
        header={
          hasItems ? (
            <div
              className={`flex flex-col ${
                title ? "justify-between" : "justify-end"
              } md:flex-row`}
            >
              {title && <div>{title}</div>}
              <div className="w-full self-center sm:w-auto">
                <Pagination
                  selected={page}
                  pages={pages}
                  onChange={handlePageSelection}
                />
              </div>
            </div>
          ) : undefined
        }
        emptyState="No blocks"
      >
        {hasItems ? (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {!items
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Fragment key={i}>{itemSkeleton}</Fragment>
                  ))
                : (items ?? []).map((item, i) => (
                    <Fragment key={i}>{item}</Fragment>
                  ))}
            </div>
            <div className="flex w-full flex-col items-center gap-3 text-sm md:flex-row md:justify-between">
              <div className="flex items-center justify-start gap-2">
                Displayed items:
                <Dropdown
                  items={PAGE_SIZES}
                  selected={pageSize}
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
        ) : undefined}
      </Card>
    </>
  );
};
