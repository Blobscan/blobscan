import { useMemo } from "react";
import type { NextPage } from "next";

import {
  DailyAvgBlobGasPriceChart,
  DailyBlobFeeChart,
  DailyBlobGasUsedChart,
  DailyBlocksChart,
  DailyAvgBlobFeeChart,
} from "~/components/Charts/Block";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";

const BlockStats: NextPage = function () {
  const { data: dailyBlockStats, error: dailyBlockErr } =
    api.stats.getBlockDailyStats.useQuery({
      timeFrame: "30d",
    });
  const { data: overallBlockStats_, error: overallBlockStatsErr } =
    api.stats.getBlockOverallStats.useQuery();
  const overallBlockStats = useMemo(
    () => ({
      ...overallBlockStats_,
      totalBlobFee: BigInt(overallBlockStats_?.totalBlobFee ?? 0),
      totalBlobGasUsed: BigInt(overallBlockStats_?.totalBlobGasUsed ?? 0),
    }),
    [overallBlockStats_]
  );

  const error = dailyBlockErr || overallBlockStatsErr;

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
        header="Block Stats"
        metrics={[
          {
            name: "Total Blocks",
            metric: {
              value: overallBlockStats?.totalBlocks,
            },
          },
          {
            name: "Total Blob Gas Used",
            metric: {
              value: overallBlockStats?.totalBlobGasUsed,
            },
          },
          {
            name: "Total Blob Fees",
            metric: {
              value: overallBlockStats?.totalBlobFee,
              type: "ethereum",
            },
          },
          {
            name: "Avg. Blob Gas Price",
            metric: overallBlockStats
              ? {
                  value: overallBlockStats.avgBlobGasPrice,
                  type: "ethereum",
                  numberFormatOpts: {
                    maximumFractionDigits: 9,
                  },
                }
              : undefined,
          },
        ]}
        charts={[
          <DailyBlocksChart
            key={0}
            days={dailyBlockStats?.days}
            blocks={dailyBlockStats?.totalBlocks}
          />,
          <DailyBlobGasUsedChart
            key={1}
            days={dailyBlockStats?.days}
            blobGasUsed={dailyBlockStats?.totalBlobGasUsed}
          />,
          <DailyBlobFeeChart
            key={2}
            days={dailyBlockStats?.days}
            blobFees={dailyBlockStats?.totalBlobFees}
          />,
          <DailyAvgBlobFeeChart
            key={3}
            days={dailyBlockStats?.days}
            avgBlobFees={dailyBlockStats?.avgBlobFees}
          />,
          <DailyAvgBlobGasPriceChart
            key={4}
            days={dailyBlockStats?.days}
            avgBlobGasPrices={dailyBlockStats?.avgBlobGasPrices}
          />,
        ]}
      />
    </>
  );
};

export default BlockStats;
