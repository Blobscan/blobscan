import {
  type DailyBlobStats,
  type DailyTransactionStats,
  type SingleDailyBlobStats,
  type SingleDailyTransactionStats,
} from "~/types";

export type AggregatedDailyBlobStats = {
  days: string[];
  blobs: SingleDailyBlobStats["totalBlobs"][];
  uniqueBlobs: SingleDailyBlobStats["totalUniqueBlobs"][];
  blobSizes: number[];
  avgBlobSizes: SingleDailyBlobStats["avgBlobSize"][];
};

export type AggregatedDailyTransactionStats = {
  days: string[];
  transactions: SingleDailyTransactionStats["totalTransactions"][];
  uniqueReceivers: SingleDailyTransactionStats["totalUniqueReceivers"][];
  uniqueSenders: SingleDailyTransactionStats["totalUniqueSenders"][];
};

function getDateFromDateTime(date: Date): string {
  return date.toISOString().split("T")[0] as string;
}

function bytesToKilobytes(bytes: bigint): number {
  return Number(bytes / BigInt(1000));
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
      aggregatedStats.blobSizes.push(bytesToKilobytes(totalBlobSize));
      aggregatedStats.avgBlobSizes.push(avgBlobSize);

      return aggregatedStats;
    },
    { days: [], blobs: [], uniqueBlobs: [], blobSizes: [], avgBlobSizes: [] },
  );
}

export function aggregateDailyTransactionStats(
  stats: DailyTransactionStats,
): AggregatedDailyTransactionStats {
  return stats.reduce<AggregatedDailyTransactionStats>(
    (
      aggregatedStats,
      { day, totalTransactions, totalUniqueReceivers, totalUniqueSenders },
    ) => {
      aggregatedStats.days.push(getDateFromDateTime(day));
      aggregatedStats.transactions.push(totalTransactions);
      aggregatedStats.uniqueReceivers.push(totalUniqueReceivers);
      aggregatedStats.uniqueSenders.push(totalUniqueSenders);

      return aggregatedStats;
    },
    {
      days: [],
      transactions: [],
      uniqueReceivers: [],
      uniqueSenders: [],
    },
  );
}
