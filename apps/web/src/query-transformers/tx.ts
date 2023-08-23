import type {
  AllTransactions,
  DailyTransactionStats,
  OverallTxStats,
  TRPCResult,
  TransformedDailyTransactionStats,
  TransformedOverallTxStats,
} from "~/types";

export function transformTxsResult({
  data,
  isLoading,
}: TRPCResult<AllTransactions>): AllTransactions | undefined {
  if (isLoading) {
    return;
  }

  if (!data) {
    return {
      transactions: [],
      totalTransactions: 0,
    };
  }

  return data;
}

export function transformDailyTxStatsResult({
  data,
  isLoading,
}: TRPCResult<DailyTransactionStats>):
  | TransformedDailyTransactionStats
  | undefined {
  if (isLoading) {
    return;
  }

  if (!data) {
    return {
      days: [],
      transactions: [],
      uniqueReceivers: [],
      uniqueSenders: [],
    };
  }

  return data.reduce<TransformedDailyTransactionStats>(
    (
      aggregatedStats,
      { day, totalTransactions, totalUniqueReceivers, totalUniqueSenders }
    ) => {
      aggregatedStats.days.push(day.toISOString());
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
    }
  );
}

export function transformOverallTxStatsResult({
  data,
  isLoading,
}: TRPCResult<OverallTxStats>): TransformedOverallTxStats | undefined {
  if (isLoading) {
    return;
  }

  return {
    totalTransactions: data?.totalTransactions ?? 0,
    totalUniqueReceivers: data?.totalUniqueReceivers ?? 0,
    totalUniqueSenders: data?.totalUniqueSenders ?? 0,
    updatedAt: data?.updatedAt,
  };
}
