import type {
  AllBlocks,
  DailyBlockStats,
  OverallBlockStats,
  TRPCResult,
  TransformToArray,
} from "~/types";

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

function transformToArray<T extends Record<string, unknown>>(
  data: T[],
  initialValue: TransformToArray<T>
): TransformToArray<T> {
  return data.reduce<TransformToArray<T>>((transformedStats, currentStats) => {
    for (const statName of Object.keys(transformedStats)) {
      const statName_ = statName as keyof T;

      if (!transformedStats[statName_]) {
        transformedStats[statName_] = [];
      }

      transformedStats[statName_].push(currentStats[statName_]);
    }

    return transformedStats;
  }, initialValue);
}

export function transformDailyBlockStatsResult({
  data,
}: TRPCResult<DailyBlockStats>) {
  return transformToArray(data ?? [], {
    day: [],
    totalBlocks: [],
    totalBlobGasUsed: [],
    totalBlobAsCalldataGasUsed: [],
    totalBlobFee: [],
    totalBlobAsCalldataFee: [],
    avgBlobFee: [],
    avgBlobAsCalldataFee: [],
    avgBlobGasPrice: [],
  });
}

export function transformOverallBlockStatsResult({
  data,
  isLoading,
}: TRPCResult<OverallBlockStats>) {
  if (isLoading) {
    return;
  }

  return {
    totalBlocks: data?.totalBlocks ?? 0,
    totalBlobGasUsed: (data?.totalBlobGasUsed ?? 0).toString(),
    totalBlobAsCalldataGasUsed: (
      data?.totalBlobAsCalldataGasUsed ?? 0
    ).toString(),
    totalBlobFee: data?.totalBlobFee ?? 0,
    totalBlobAsCalldataFee: data?.totalBlobAsCalldataFee ?? 0,
    avgBlobFee: data?.avgBlobFee ?? 0,
    avgBlobAsCalldataFee: data?.avgBlobAsCalldataFee ?? 0,
    avgBlobGasPrice: data?.avgBlobGasPrice ?? 0,
    updatedAt: data?.updatedAt,
  };
}
