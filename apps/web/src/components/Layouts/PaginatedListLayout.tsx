import { Fragment, useCallback } from "react";
import type { FC, ReactNode } from "react";
import { useRouter } from "next/router";

import { Header } from "~/components/Header";
import { Card } from "../Cards/Card";
import { EmptyState } from "../EmptyState";
import { Pagination } from "../Pagination";
import type { PaginationProps } from "../Pagination";
import type { PageSizeOption } from "../Selectors";
import { PageSizeSelector } from "../Selectors";

export type PaginatedListLayoutProps = {
  header?: ReactNode;
  title?: ReactNode;
  items?: ReactNode[];
  totalItems?: number;
  page?: number;
  pageSize?: number;
  itemSkeleton: ReactNode;
  isLoading?: boolean;
};

export const PaginatedListLayout: FC<PaginatedListLayoutProps> = function ({
  header,
  title,
  items,
  totalItems,
  page = 1,
  pageSize = 50,
  itemSkeleton,
  isLoading,
}) {
  const router = useRouter();
  const pages =
    totalItems !== undefined
      ? totalItems === 0
        ? 1
        : Math.ceil(totalItems / pageSize)
      : undefined;
  const isEmpty = !isLoading && !items?.length;

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
          !isEmpty ? (
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
      >
        {!isEmpty ? (
          <div className="flex flex-col gap-6">
            <div className="space-y-4">
              {isLoading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <Fragment key={i}>{itemSkeleton}</Fragment>
                  ))
                : (items ?? []).map((item, i) => (
                    <Fragment key={i}>{item}</Fragment>
                  ))}
            </div>
            <div className="flex w-full flex-col items-center gap-3 text-sm md:flex-row md:justify-between">
              <div className="flex items-center justify-start gap-2">
                Displayed items:
                <PageSizeSelector
                  selected={{ value: pageSize }}
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
        ) : (
          <div className="h-[400px] sm:h-[500px]">
            <EmptyState description="No Blob Transactions" />
          </div>
        )}
      </Card>
    </>
  );
};
