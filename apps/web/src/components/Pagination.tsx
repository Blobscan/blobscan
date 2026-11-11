import type { FC } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

import type { Pagination as PaginationData } from "~/types";
import { Button } from "./Button";

export type PaginationProps = {
  pagination?: PaginationData;
  hasCursor: boolean;
  isLoading?: boolean;
  onChange(cursor: string | null): void;
};

export const Pagination: FC<PaginationProps> = function ({
  pagination,
  hasCursor,
  isLoading,
  onChange,
}) {
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
        className="inline-flex items-center gap-1"
        onClick={() =>
          pagination?.previousCursor && onChange(pagination.previousCursor)
        }
      >
        <ChevronLeftIcon
          className="hidden h-4 w-4 sm:block"
          aria-hidden="true"
        />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading || !pagination?.nextCursor}
        className="inline-flex items-center gap-1"
        onClick={() =>
          pagination?.nextCursor && onChange(pagination.nextCursor)
        }
      >
        Next
        <ChevronRightIcon
          className="hidden h-4 w-4 sm:block"
          aria-hidden="true"
        />
      </Button>
    </nav>
  );
};
