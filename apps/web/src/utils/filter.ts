import type { ParsedUrlQuery } from "querystring";

import type { Rollup } from "~/types";

export function getFilterParams(query: ParsedUrlQuery): {
  rollup: Rollup | undefined;
} {
  const rollup = query.rollup as Rollup;

  return { rollup };
}
