import type {
  DailyBlobStats,
  OverallBlobStats,
  TRPCResult,
  TransformedDailyBlobStats,
  TransformedOverallBlobStats,
} from "~/types";
import { bytesToKilobytes, getDateFromDateTime } from "~/utils";

export function transformOverallBlobStatsResult({
  data,
  isLoading,
}: TRPCResult<OverallBlobStats>): TransformedOverallBlobStats | undefined {
  if (isLoading) {
    return;
  }

  return {
    avgBlobSize: data?.avgBlobSize ?? 0,
    totalBlobs: data?.totalBlobs ?? 0,
    totalBlobSize: data?.avgBlobSize ? bytesToKilobytes(data.totalBlobSize) : 0,
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
      formattedStats.days.push(getDateFromDateTime(day));
      formattedStats.blobs.push(totalBlobs);
      formattedStats.uniqueBlobs.push(totalUniqueBlobs);
      formattedStats.blobSizes.push(bytesToKilobytes(totalBlobSize));
      formattedStats.avgBlobSizes.push(avgBlobSize);

      return formattedStats;
    },
    { days: [], blobs: [], uniqueBlobs: [], blobSizes: [], avgBlobSizes: [] }
  );
}
