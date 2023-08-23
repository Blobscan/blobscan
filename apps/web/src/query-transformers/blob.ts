import type {
  DailyBlobStats,
  OverallBlobStats,
  TRPCResult,
  TransformedDailyBlobStats,
  TransformedOverallBlobStats,
  AllBlobs,
} from "~/types";

export function transformBlobsResult({
  data,
  isLoading,
}: TRPCResult<AllBlobs>): AllBlobs | undefined {
  if (isLoading) {
    return;
  }

  if (!data) {
    return {
      blobs: [],
      totalBlobs: 0,
    };
  }

  return data;
}

export function transformOverallBlobStatsResult({
  data,
  isLoading,
}: TRPCResult<OverallBlobStats>): TransformedOverallBlobStats | undefined {
  if (isLoading) {
    return;
  }

  return {
    avgBlobSize: Number(data?.avgBlobSize ?? 0),
    totalBlobs: data?.totalBlobs ?? 0,
    totalBlobSize: data?.totalBlobSize ?? BigInt(0),
    totalUniqueBlobs: data?.totalUniqueBlobs ?? 0,
    updatedAt: data?.updatedAt,
  };
}

export function transformDailyBlobStatsResult({
  data,
  isLoading,
}: TRPCResult<DailyBlobStats>): TransformedDailyBlobStats | undefined {
  if (isLoading) {
    return;
  }

  if (!data) {
    return {
      days: [],
      blobs: [],
      uniqueBlobs: [],
      blobSizes: [],
      avgBlobSizes: [],
    };
  }

  return data.reduce<TransformedDailyBlobStats>(
    (
      formattedStats,
      { day, avgBlobSize, totalBlobSize, totalBlobs, totalUniqueBlobs }
    ) => {
      formattedStats.days.push(day.toISOString());
      formattedStats.blobs.push(totalBlobs);
      formattedStats.uniqueBlobs.push(totalUniqueBlobs);
      formattedStats.blobSizes.push(Number(totalBlobSize));
      formattedStats.avgBlobSizes.push(avgBlobSize);

      return formattedStats;
    },
    { days: [], blobs: [], uniqueBlobs: [], blobSizes: [], avgBlobSizes: [] }
  );
}
