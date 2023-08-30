import type { NextPage } from "next";
import NextError from "next/error";

import {
  DailyTransactionsChart,
  DailyUniqueAddressesChart,
} from "~/components/Charts/Transaction";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";

const TransactionStats: NextPage = function () {
  const { data: dailyTxStats, error: dailyTxStatsErr } =
    api.stats.getTransactionDailyStats.useQuery({
      timeFrame: "30d",
    });
  const { data: overallTxStats, error: overallTxStatsErr } =
    api.stats.getTransactionOverallStats.useQuery();

  const error = dailyTxStatsErr || overallTxStatsErr;

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
          overallTxStats
            ? [
                {
                  name: "Total Transactions",
                  metric: {
                    value: overallTxStats.totalTransactions,
                  },
                },
                {
                  name: "Total Unique Receivers",
                  metric: {
                    value: overallTxStats.totalUniqueReceivers,
                  },
                },
                {
                  name: "Total Unique Senders",
                  metric: {
                    value: overallTxStats.totalUniqueSenders,
                  },
                },
                {
                  name: "Avg. Max Blob Gas Fee",
                  metric: {
                    value: overallTxStats.avgMaxBlobGasFee,
                  },
                },
              ]
            : undefined
        }
        charts={[
          <DailyTransactionsChart
            key={0}
            days={dailyTxStats?.days}
            transactions={dailyTxStats?.totalTransactions}
          />,
          <DailyUniqueAddressesChart
            key={1}
            days={dailyTxStats?.days}
            uniqueReceivers={dailyTxStats?.totalUniqueReceivers}
            uniqueSenders={dailyTxStats?.totalUniqueSenders}
          />,
        ]}
      />
    </>
  );
};

export default TransactionStats;
