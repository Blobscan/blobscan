import { Fragment, useCallback } from "react";
import type { FC, ReactNode } from "react";
import { useRouter } from "next/router";

import { Header } from "~/components/Header";
import { Card } from "../Cards/Card";
import { Dropdown } from "../Dropdown";
import type { Option } from "../Dropdown";
import { Pagination } from "../Pagination";
import type { PaginationProps } from "../Pagination";

export type PaginatedListLayoutProps = {
  header?: ReactNode;
  title?: ReactNode;
  items?: ReactNode[];
  totalItems?: number;
  page: number;
  pageSize: number;
  itemSkeleton: ReactNode;
  emptyState?: ReactNode;
};

type PageSizeOption = Option<number>;

const PAGE_SIZES_OPTIONS: PageSizeOption[] = [
  { value: 10 },
  { value: 25 },
  { value: 50 },
  { value: 100 },
] as const;

export const PaginatedListLayout: FC<PaginatedListLayoutProps> = function ({
  header,
  title,
  items,
  totalItems,
  page,
  pageSize,
  itemSkeleton,
  emptyState = "No items",
}) {
  const router = useRouter();
  const pages =
    totalItems !== undefined
      ? totalItems === 0
        ? 1
        : Math.ceil(totalItems / pageSize)
      : undefined;
  const hasItems = !items || items.length;

  const handlePageSizeSelection = useCallback(
    (option: PageSizeOption) => {
      const newPageSize = option.value;

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
      });
    },
    [page, totalItems, router]
  );

  const handlePageSelection = useCallback<PaginationProps["onChange"]>(
    (newPage) => {
      void router.push({
        pathname: router.pathname,
        query: {
          ...router.query,
          p: newPage,
          ps: pageSize,
        },
      });
    },
    [pageSize, router]
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
        emptyState={emptyState}
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
        ) : undefined}
      </Card>
    </>
  );
};
