import { useCallback } from "react";
import { useRouter } from "next/compat/router";

import type { PageSizeOption } from "~/components/Selectors/PageSizeSelector";

export function useCursorPagination(pageSize = 50) {
  const router = useRouter();

  const navigate = useCallback(
    (cursor: string | null, ps: number) => {
      if (!router) return;
      const query = { ...router.query };
      delete query.cursor;
      delete query.p;
      query.ps = String(ps);
      if (cursor) query.cursor = cursor;
      void router.push({ pathname: router.pathname, query });
    },
    [router]
  );

  const onChange = useCallback(
    (cursor: string | null) => {
      navigate(cursor, pageSize);
    },
    [navigate, pageSize]
  );

  const onPageSizeChange = useCallback(
    ({ value }: PageSizeOption) => {
      navigate(null, value);
    },
    [navigate]
  );

  return { onChange, onPageSizeChange, hasCursor: !!router?.query.cursor };
}
