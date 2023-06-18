import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import {
  DailyTransactionsChart,
  DailyUniqueAddressesChart,
} from "~/components/Charts/Transaction";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { Spinner } from "~/components/Spinners/Spinner";
import { formatDailyTransactionStats } from "~/utils";

const TransactionStats: NextPage = function () {
  const dailyStatsQuery = api.stats.transaction.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const overallStatsQuery = api.stats.transaction.getOverallStats.useQuery();

  const { days, transactions, uniqueReceivers, uniqueSenders } = useMemo(
    () => formatDailyTransactionStats(dailyStatsQuery.data ?? []),
    [dailyStatsQuery.data],
  );

  if (
    dailyStatsQuery.status !== "success" ||
    overallStatsQuery.status !== "success"
  ) {
    return <Spinner />;
  }

  const overallStats = overallStatsQuery.data;

  return (
    <>
      <StatsLayout
        header="Transaction Stats"
        metrics={[
          {
            name: "Total Transactions",
            value: overallStats?.totalTransactions,
          },
          {
            name: "Total Unique Receivers",
            value: overallStats?.totalUniqueReceivers,
          },
          {
            name: "Total Unique Senders",
            value: overallStats?.totalUniqueSenders,
          },
        ]}
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
