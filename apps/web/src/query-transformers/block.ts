import type {
  AllBlocks,
  DailyBlockStats,
  OverallBlockStats,
  TRPCResult,
  TransformedDailyBlockStats,
  TransformedOverallBlockStats,
} from "~/types";
import { getDateFromDateTime } from "~/utils";

export function transformBlocksResult({
  data,
  isLoading,
}: TRPCResult<AllBlocks>): AllBlocks | undefined {
  if (isLoading) {
    return;
  }

  if (!data) {
    return {
      blocks: [],
      totalBlocks: 0,
    };
  }

  return data;
}

export function transformDailyBlockStatsResult({
  data,
  isLoading,
}: TRPCResult<DailyBlockStats>): TransformedDailyBlockStats | undefined {
  if (isLoading) {
    return;
  }

  if (!data) {
    return {
      days: [],
      blocks: [],
    };
  }

  return data.reduce<TransformedDailyBlockStats>(
    (aggregatedStats, { day, totalBlocks }) => {
      aggregatedStats.days.push(getDateFromDateTime(day));
      aggregatedStats.blocks.push(totalBlocks);

      return aggregatedStats;
    },
    {
      days: [],
      blocks: [],
    }
  );
}

export function transformOverallBlockStatsResult({
  data,
  isLoading,
}: TRPCResult<OverallBlockStats>): TransformedOverallBlockStats | undefined {
  if (isLoading) {
    return;
  }

  return {
    totalBlocks: data?.totalBlocks ?? 0,
    updatedAt: data?.updatedAt,
  };
}
