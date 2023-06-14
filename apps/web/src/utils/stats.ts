import { type DailyBlobStats, type SingleDailyBlobStats } from "~/types";

export type AggregatedDailyBlobStats = {
  days: string[];
  blobs: SingleDailyBlobStats["totalBlobs"][];
  uniqueBlobs: SingleDailyBlobStats["totalUniqueBlobs"][];
  blobSizes: SingleDailyBlobStats["totalBlobSize"][];
  avgBlobSizes: SingleDailyBlobStats["avgBlobSize"][];
};

function getDateFromDateTime(date: Date): string {
  return date.toISOString().split("T")[0] as string;
}

export function aggregateDailyBlobStats(
  stats: DailyBlobStats,
): AggregatedDailyBlobStats {
  return stats.reduce<AggregatedDailyBlobStats>(
    (
      aggregatedStats,
      { day, avgBlobSize, totalBlobSize, totalBlobs, totalUniqueBlobs },
    ) => {
      aggregatedStats.days.push(getDateFromDateTime(day));
      aggregatedStats.blobs.push(totalBlobs);
      aggregatedStats.uniqueBlobs.push(totalUniqueBlobs);
      aggregatedStats.blobSizes.push(totalBlobSize);
      aggregatedStats.avgBlobSizes.push(avgBlobSize);

      return aggregatedStats;
    },
    { days: [], blobs: [], uniqueBlobs: [], blobSizes: [], avgBlobSizes: [] },
  );
}
