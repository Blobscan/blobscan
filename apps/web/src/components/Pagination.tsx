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
        aria-label="Previous"
        className="inline-flex items-center"
        onClick={() =>
          pagination?.previousCursor && onChange(pagination.previousCursor)
        }
      >
        <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading || !pagination?.nextCursor}
        aria-label="Next"
        className="inline-flex items-center"
        onClick={() =>
          pagination?.nextCursor && onChange(pagination.nextCursor)
        }
      >
        <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
      </Button>
    </nav>
  );
};
