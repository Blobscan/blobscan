import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { Rollup } from "@blobscan/api/enums";

import type { Rollup as LowercaseRollup } from "~/types";

type QueryParams = {
  p: number;
  ps: number;
  rollup?: LowercaseRollup | "null";
  from?: string;
};

const DEFAULT_INITIAL_PAGE_SIZE = 50;
const DEFAULT_INITIAL_PAGE = 1;

export function useQueryParams() {
  const router = useRouter();
  const [queryParams, setQueryParams] = useState<QueryParams>({
    p: DEFAULT_INITIAL_PAGE,
    ps: DEFAULT_INITIAL_PAGE_SIZE,
  });

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { from, p, ps, rollup } = router.query;

    setQueryParams({
      from: (from as string)?.toLowerCase(),
      p: parseInt(p as string) || DEFAULT_INITIAL_PAGE,
      ps: parseInt(ps as string) || DEFAULT_INITIAL_PAGE_SIZE,
      rollup: rollup
        ? rollup === "null"
          ? rollup
          : (Rollup[
              (rollup as string).toUpperCase() as keyof typeof Rollup
            ]?.toLowerCase() as LowercaseRollup)
        : undefined,
    });
  }, [router]);

  return queryParams;
}
