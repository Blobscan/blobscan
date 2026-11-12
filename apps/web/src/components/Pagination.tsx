import type { FC } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

import { formatNumber } from "~/utils/number";
import type { Pagination as PaginationData } from "~/types";
import { Button } from "./Button";

export type PaginationProps = {
  pagination?: PaginationData;
  hasCursor: boolean;
  isLoading?: boolean;
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onChange(cursor: string | null, page?: number): void;
};

export const Pagination: FC<PaginationProps> = function ({
  pagination,
  hasCursor,
  isLoading,
  currentPage = 1,
  pageSize = 50,
  totalItems,
  onChange,
}) {
  const totalPages =
    totalItems === undefined
      ? undefined
      : Math.max(1, Math.ceil(totalItems / pageSize));
  return (
    <nav aria-label="Pagination" className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading || !hasCursor}
        onClick={() => onChange(null)}
      >
        First
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading || !pagination?.previousCursor}
        aria-label="Previous"
        className="inline-flex items-center"
        onClick={() =>
          pagination?.previousCursor &&
          onChange(pagination.previousCursor, Math.max(1, currentPage - 1))
        }
      >
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </Button>
      <span
        aria-live="polite"
        className="whitespace-nowrap text-sm text-contentSecondary-light dark:text-contentSecondary-dark"
      >
        Page {formatNumber(currentPage)} of{" "}
        {totalPages === undefined ? "…" : formatNumber(totalPages)}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading || !pagination?.nextCursor}
        aria-label="Next"
        className="inline-flex items-center"
        onClick={() =>
          pagination?.nextCursor &&
          onChange(pagination.nextCursor, currentPage + 1)
        }
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </Button>
    </nav>
  );
};
