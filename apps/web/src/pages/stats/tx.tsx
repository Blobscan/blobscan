import { type NextPage } from "next";
import NextError from "next/error";

import {
  DailyTransactionsChart,
  DailyUniqueAddressesChart,
} from "~/components/Charts/Transaction";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { useTransformResult } from "~/hooks/useTransformResult";
import {
  transformDailyTxStatsResult,
  transformOverallTxStatsResult,
} from "~/query-transformers";

const TransactionStats: NextPage = function () {
  const dailyTxStatsRes = api.stats.transaction.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const dailyTxStats = useTransformResult(
    dailyTxStatsRes,
    transformDailyTxStatsResult,
  );
  const overallTxStatsRes = api.stats.transaction.getOverallStats.useQuery();
  const overallTxStats = useTransformResult(
    overallTxStatsRes,
    transformOverallTxStatsResult,
  );

  const error = dailyTxStatsRes.error || overallTxStatsRes.error;

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
                  value: overallTxStats.totalTransactions,
                },
                {
                  name: "Total Unique Receivers",
                  value: overallTxStats.totalUniqueReceivers,
                },
                {
                  name: "Total Unique Senders",
                  value: overallTxStats.totalUniqueSenders,
                },
              ]
            : undefined
        }
        charts={[
          <DailyTransactionsChart
            key={0}
            days={dailyTxStats?.days}
            transactions={dailyTxStats?.transactions}
          />,
          <DailyUniqueAddressesChart
            key={1}
            days={dailyTxStats?.days}
            uniqueReceivers={dailyTxStats?.uniqueReceivers}
            uniqueSenders={dailyTxStats?.uniqueSenders}
          />,
        ]}
      />
    </>
  );
};

export default TransactionStats;
