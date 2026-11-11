import type { FiltersParam } from "~/schemas/filters";
import { listPageParamsSchema } from "~/schemas/listPage";
import { normalizePaginationParams } from "~/schemas/pagination";
import { toCommaSeparatedParam } from "~/schemas/utils";
import { useUrlState } from "./useUrlState";

export function useListPageParams() {
  const { state: urlState, isReady } = useUrlState(listPageParamsSchema);

  const { cursor, ps, page, sort, ...filterState } = urlState || {};

  const filterParams: Omit<FiltersParam, "categories" | "rollups"> & {
    categories?: string;
    rollups?: string;
  } = {
    ...filterState,
    categories: filterState.categories
      ? toCommaSeparatedParam(filterState.categories)
      : undefined,
    rollups: filterState.rollups
      ? toCommaSeparatedParam(filterState.rollups)
      : undefined,
  };

  const normalizedPagination = normalizePaginationParams({ cursor, ps, page });
  const pagination = {
    cursor: normalizedPagination.cursor,
    ps: normalizedPagination.ps,
  };

  return {
    filterParams,
    pagination,
    sort,
    isReady,
  };
}
