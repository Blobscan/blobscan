import type { ParsedUrlQuery } from "querystring";

import type { Rollup } from "~/types";

export function getFilterParams(query: ParsedUrlQuery): {
  rollup: Rollup | undefined;
  startDate: Date | undefined;
  endDate: Date | undefined;
  startBlock: number | undefined;
  endBlock: number | undefined;
} {
  const rollup = query.rollup as Rollup;

  const startDate_ = query["start-date"] as string;
  const endDate_ = query["end-date"] as string;
  const startDate = startDate_ ? new Date(startDate_) : undefined;
  const endDate = endDate_ ? new Date(endDate_) : undefined;
  const startBlock_ = query["start-block"];
  const endBlock_ = query["end-block"];
  const startBlock = startBlock_ ? Number(startBlock_) : undefined;
  const endBlock = endBlock_ ? Number(endBlock_) : undefined;

  return { rollup, startDate, endDate, startBlock, endBlock };
}
