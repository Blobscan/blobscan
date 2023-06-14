import { useMemo } from "react";
import { type NextPage } from "next";

import { api } from "~/utils/api";
import { aggregateDailyTransactionStats } from "~/utils/stats";
import {
  DailyTransactionsChart,
  DailyUniqueAddressesChart,
} from "~/components/Charts/Transaction";
import { Spinner } from "~/components/Spinners/Spinner";
import { StatsSection } from "~/components/StatsSection";

const TransactionStats: NextPage = function () {
  const transactionDailyStatsQuery =
    api.stats.transaction.getDailyStats.useQuery({
      timeFrame: "30d",
    });
  const transactionDailyData = transactionDailyStatsQuery.data;
  const { days, transactions, uniqueReceivers, uniqueSenders } = useMemo(
    () => aggregateDailyTransactionStats(transactionDailyData ?? []),
    [transactionDailyData],
  );

  if (transactionDailyStatsQuery.status !== "success") {
    return <Spinner />;
  }

  return (
    <>
      <StatsSection
        header="Transaction Stats"
        charts={[
          {
            title: "Daily Transactions",
            element: (
              <DailyTransactionsChart days={days} transactions={transactions} />
            ),
          },
          {
            title: "Daily Unique Addresses",
            element: (
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
