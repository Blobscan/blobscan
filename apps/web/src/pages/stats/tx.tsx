import { useMemo } from "react";
import { type NextPage } from "next";
import NextError from "next/error";

import {
  DailyTransactionsChart,
  DailyUniqueAddressesChart,
} from "~/components/Charts/Transaction";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { formatDailyTransactionStats } from "~/utils";

const TransactionStats: NextPage = function () {
  const { data: dailyStatsData, error: dailyStatsError } =
    api.stats.transaction.getDailyStats.useQuery({
      timeFrame: "30d",
    });
  const { data: overallStats, error: overallStatsError } =
    api.stats.transaction.getOverallStats.useQuery();
  const { days, transactions, uniqueReceivers, uniqueSenders } = useMemo(
    () => formatDailyTransactionStats(dailyStatsData ?? []),
    [dailyStatsData],
  );
  const error = dailyStatsError || overallStatsError;

  if (error) {
    return (
      <NextError
        title={error.message}
        statusCode={error.data?.httpStatus ?? 500}
      />
    );
  }

  return (
    <>
      <StatsLayout
        header="Transaction Stats"
        metrics={
          overallStats
            ? [
                {
                  name: "Total Transactions",
                  value: overallStats.totalTransactions,
                },
                {
                  name: "Total Unique Receivers",
                  value: overallStats.totalUniqueReceivers,
                },
                {
                  name: "Total Unique Senders",
                  value: overallStats.totalUniqueSenders,
                },
              ]
            : undefined
        }
        charts={[
          {
            name: "Daily Transactions",
            chart: (
              <DailyTransactionsChart days={days} transactions={transactions} />
            ),
          },
          {
            name: "Daily Unique Addresses",
            chart: (
              <DailyUniqueAddressesChart
                days={days}
                uniqueReceivers={uniqueReceivers}
                uniqueSenders={uniqueSenders}
              />
            ),
          },
        ]}
      />
    </>
  );
};

export default TransactionStats;
