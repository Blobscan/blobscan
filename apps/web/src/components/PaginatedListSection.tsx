import { useCallback, type FC, type ReactNode } from "react";

import { SectionCard } from "./Cards/SectionCard";
import { Dropdown, type DropdownProps } from "./Dropdown";
import { Pagination, type PaginationProps } from "./Pagination";

export type PaginatedListSectionProps = {
  header: ReactNode;
  items: ReactNode[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageSelected(page: number, limit: number): void;
};

const PAGE_SIZES = [10, 25, 50, 100];

export const PaginatedListSection: FC<PaginatedListSectionProps> = function ({
  header,
  items,
  totalItems,
  page,
  pageSize,
  onPageSelected,
}) {
  const pages = Math.ceil(totalItems / pageSize);

  const handlePageSizeSelection = useCallback<DropdownProps["onChange"]>(
    (newPageSize: number) => onPageSelected(page, newPageSize),
    [page, onPageSelected],
  );

  const handlePageSelection = useCallback<PaginationProps["onChange"]>(
    (newPage) => onPageSelected(newPage, pageSize),
    [pageSize, onPageSelected],
  );

  return (
    <SectionCard
      header={
        <div className="flex justify-between">
          {header}
          <Pagination
            selected={page}
            pages={pages}
            onChange={handlePageSelection}
          />
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-6">{items.map((i) => i)}</div>
        <div className="flex w-full justify-between text-sm">
          <div className="flex items-center gap-2">
            Displayed items:
            <Dropdown
              items={PAGE_SIZES}
              selected={pageSize}
              onChange={handlePageSizeSelection}
            />
          </div>
          <Pagination
            selected={page}
            pages={pages}
            onChange={handlePageSelection}
          />
        </div>
      </div>
    </SectionCard>
  );
};
