import { type ParsedUrlQuery } from "querystring";

export function getPaginationParams(query: ParsedUrlQuery): {
  ps: number;
  p: number;
} {
  const page_ = parseInt(query.p as string);
  const pageSize_ = parseInt(query.ps as string);
  const page = isNaN(page_) ? 1 : page_;
  const pageSize = isNaN(pageSize_) ? 50 : pageSize_;

  return { ps: pageSize, p: page };
}

export function buildRouteWithPagination(
  path: string,
  page: number,
  pageSize: number,
): string {
  return `${path}?p=${page}&ps=${pageSize}`;
}
