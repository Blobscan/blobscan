import { useCallback } from "react";
import { useRouter } from "next/compat/router";

import type { PageSizeOption } from "~/components/Selectors/PageSizeSelector";
import {
  DEFAULT_PAGE_SIZE,
  normalizePaginationParams,
  paginationParamsSchema,
} from "~/schemas/pagination";

export function useCursorPagination(pageSize = DEFAULT_PAGE_SIZE) {
  const router = useRouter();
  const parsed = paginationParamsSchema.safeParse(router?.query ?? {});
  const params = normalizePaginationParams(
    parsed.success ? parsed.data : undefined
  );
  const hasCursor = !!params.cursor;
  const currentPage = hasCursor ? params.page : 1;

  const navigate = useCallback(
    (cursor: string | null, ps: number, page = 1) => {
      if (!router) return;
      const query = { ...router.query };
      delete query.cursor;
      delete query.p;
      delete query.page;
      query.ps = String(ps);
      if (cursor) {
        query.cursor = cursor;
        query.page = String(page);
      }
      void router.push({ pathname: router.pathname, query });
    },
    [router]
  );

  const onChange = useCallback(
    (cursor: string | null, page = 1) => {
      navigate(cursor, pageSize, page);
    },
    [navigate, pageSize]
  );

  const onPageSizeChange = useCallback(
    ({ value }: PageSizeOption) => {
      navigate(null, value);
    },
    [navigate]
  );

  return { onChange, onPageSizeChange, hasCursor, currentPage };
}
