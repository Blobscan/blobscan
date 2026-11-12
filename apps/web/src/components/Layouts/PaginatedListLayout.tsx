import { Fragment } from "react";
import type { FC, ReactNode } from "react";

import { Header } from "~/components/Header";
import { useCursorPagination } from "~/hooks/useCursorPagination";
import type { Pagination as PaginationInfo } from "~/types";
import { Card } from "../Cards/Card";
import { ContentReveal } from "../ContentReveal";
import { EmptyState } from "../EmptyState";
import type { PaginationProps } from "../Pagination";
import { Pagination } from "../Pagination";
import { PageSizeSelector } from "../Selectors";

export type PaginatedListLayoutProps = {
  header?: ReactNode;
  title?: ReactNode;
  items?: ReactNode[];
  pagination?: PaginationInfo;
  totalItems?: number;
  pageSize?: number;
  itemSkeleton: ReactNode;
  isLoading?: boolean;
};

export const PaginatedListLayout: FC<PaginatedListLayoutProps> = function ({
  header,
  title,
  items,
  pagination,
  totalItems,
  pageSize = 50,
  itemSkeleton,
  isLoading,
}) {
  const { onChange, onPageSizeChange, hasCursor, currentPage } =
    useCursorPagination(pageSize);
  const isEmpty = !isLoading && !items?.length;

  const paginationProps: PaginationProps = {
    pagination,
    currentPage,
    pageSize,
    totalItems,
    hasCursor,
    isLoading,
    onChange,
  };

  return (
    <>
      <Header>{header}</Header>
      <Card
        header={
          !isEmpty || hasCursor ? (
            <div
              className={`flex flex-col ${
                title ? "justify-between" : "justify-end"
              } md:flex-row`}
            >
              {title && <div>{title}</div>}
              <div className="w-full self-center sm:w-auto">
                <Pagination {...paginationProps} />
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
                    <ContentReveal key={i} index={i}>
                      {item}
                    </ContentReveal>
                  ))}
            </div>
            <div className="flex w-full flex-col items-center gap-3 text-sm md:flex-row md:justify-between">
              <div className="flex items-center justify-start gap-2">
                Displayed items:
                <PageSizeSelector
                  selected={{ value: pageSize }}
                  onChange={onPageSizeChange}
                />
              </div>
              <div className="w-full sm:w-auto">
                <Pagination {...paginationProps} />
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
