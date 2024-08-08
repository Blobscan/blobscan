import type { ParsedUrlQuery } from "querystring";

const DEFAULT_INITIAL_PAGE_SIZE = 25;

export function getPaginationParams(
  query: ParsedUrlQuery,
  initialPageSize = DEFAULT_INITIAL_PAGE_SIZE
): {
  ps: number;
  p: number;
} {
  const page_ = parseInt(query.p as string);
  const pageSize_ = parseInt(query.ps as string);
  const page = isNaN(page_) ? 1 : page_;
  const pageSize = isNaN(pageSize_) ? initialPageSize : pageSize_;

  return { ps: pageSize, p: page };
}
