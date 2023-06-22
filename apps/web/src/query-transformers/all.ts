import {
  type AllOverallStats,
  type TRPCResult,
  type TransformAllOverallStats,
} from "~/types";
import { transformOverallBlobStatsResult } from "./blob";
import { transformOverallBlockStatsResult } from "./block";
import { transformOverallTxStatsResult } from "./tx";

export function transformAllOverallStatsResult({
  data,
  isLoading,
}: TRPCResult<AllOverallStats>): Partial<TransformAllOverallStats> | undefined {
  if (isLoading) {
    return;
  }

  return {
    block: transformOverallBlockStatsResult({ data: data?.block, isLoading }),
    transaction: transformOverallTxStatsResult({
      data: data?.transaction,
      isLoading,
    }),
    blob: transformOverallBlobStatsResult({ data: data?.blob, isLoading }),
  };
}
