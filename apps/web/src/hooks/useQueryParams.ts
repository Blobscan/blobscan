import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import type { Category, Rollup as LowercaseRollup } from "~/types";

export type Sort = "asc" | "desc";

type FilterQueryParams = Partial<{
  from: string;
  rollup: LowercaseRollup | "null";
  category: Category;
  startDate: Date;
  endDate: Date;
  startBlock: number;
  endBlock: number;
  startSlot: number;
  endSlot: number;
}>;

type PaginationQueryParams = {
  p: number;
  ps: number;
  sort: Sort;
};

type QueryParams = {
  filterParams: FilterQueryParams;
  paginationParams: PaginationQueryParams;
};

const DEFAULT_INITIAL_PAGE_SIZE = 50;
const DEFAULT_INITIAL_PAGE = 1;
const DEFAULT_SORT = "desc";

export function useQueryParams() {
  const router = useRouter();
  const [queryParams, setQueryParams] = useState<QueryParams>({
    paginationParams: {
      p: DEFAULT_INITIAL_PAGE,
      ps: DEFAULT_INITIAL_PAGE_SIZE,
      sort: DEFAULT_SORT,
    },
    filterParams: {},
  });

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const {
      from: from_,
      p: p_,
      ps: ps_,
      category: category_,
      startDate: startDate_,
      endDate: endDate_,
      startBlock: startBlock_,
      endBlock: endBlock_,
      startSlot: startSlot_,
      endSlot: endSlot_,
      sort: sort_,
    } = router.query;

    const from = (from_ as string)?.toLowerCase();
    const p = parseInt(p_ as string) || DEFAULT_INITIAL_PAGE;
    const ps = parseInt(ps_ as string) || DEFAULT_INITIAL_PAGE_SIZE;
    const sort = sort_ ? (sort_ as Sort) : DEFAULT_SORT;

    const category = category_ as Category;
    const startDate = startDate_ ? new Date(startDate_ as string) : undefined;
    const endDate = endDate_ ? new Date(endDate_ as string) : undefined;
    const startBlock = parseInt(startBlock_ as string) || undefined;
    const endBlock = parseInt(endBlock_ as string) || undefined;
    const startSlot = parseInt(startSlot_ as string) || undefined;
    const endSlot = parseInt(endSlot_ as string) || undefined;

    setQueryParams({
      filterParams: {
        from,
        category,
        startDate,
        endDate,
        startBlock,
        endBlock,
        startSlot,
        endSlot,
      },
      paginationParams: {
        p,
        ps,
        sort,
      },
    });
  }, [router]);

  return queryParams;
}
