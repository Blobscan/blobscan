import { useMemo } from "react";
import type { NextPage } from "next";

import {
  DailyAvgBlobGasPriceChart,
  DailyBlobFeeChart,
  DailyBlobGasUsedChart,
  DailyBlobGasComparisonChart,
  DailyBlocksChart,
  DailyAvgBlobFeeChart,
} from "~/components/Charts/Block";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import NextError from "~/pages/_error";
import { calculatePercentage } from "~/utils";

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
      totalBlobAsCalldataFee: BigInt(
        overallBlockStats_?.totalBlobAsCalldataFee ?? 0
      ),
      totalBlobFee: BigInt(overallBlockStats_?.totalBlobFee ?? 0),
      totalBlobGasUsed: BigInt(overallBlockStats_?.totalBlobGasUsed ?? 0),
      totalBlobAsCalldataGasUsed: BigInt(
        overallBlockStats_?.totalBlobAsCalldataGasUsed ?? 0
      ),
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
          {
            name: "Total Tx Fees Saved",
            metric: overallBlockStats
              ? {
                  value:
                    overallBlockStats.totalBlobAsCalldataFee -
                    overallBlockStats.totalBlobFee,
                  type: "ethereum",
                }
              : undefined,
            secondaryMetric: overallBlockStats
              ? {
                  value: calculatePercentage(
                    overallBlockStats.totalBlobFee,
                    overallBlockStats.totalBlobAsCalldataFee,
                    { returnComplement: true }
                  ),
                  type: "percentage",
                }
              : undefined,
          },
          {
            name: "Total Gas Saved",
            metric: {
              value: overallBlockStats
                ? overallBlockStats.totalBlobAsCalldataGasUsed -
                  overallBlockStats.totalBlobGasUsed
                : undefined,
            },
            secondaryMetric:
              overallBlockStats &&
              overallBlockStats.totalBlobAsCalldataFee > BigInt(0)
                ? {
                    value: calculatePercentage(
                      overallBlockStats.totalBlobGasUsed,
                      overallBlockStats.totalBlobAsCalldataGasUsed,
                      { returnComplement: true }
                    ),
                    type: "percentage",
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
          <DailyBlobGasComparisonChart
            key={2}
            days={dailyBlockStats?.days}
            blobGasUsed={dailyBlockStats?.totalBlobGasUsed}
            blobAsCalldataGasUsed={dailyBlockStats?.totalBlobAsCalldataGasUsed}
          />,
          <DailyBlobFeeChart
            key={3}
            days={dailyBlockStats?.days}
            blobFees={dailyBlockStats?.totalBlobFees}
          />,
          <DailyAvgBlobFeeChart
            key={4}
            days={dailyBlockStats?.days}
            avgBlobFees={dailyBlockStats?.avgBlobFees}
          />,
          <DailyAvgBlobGasPriceChart
            key={5}
            days={dailyBlockStats?.days}
            avgBlobGasPrices={dailyBlockStats?.avgBlobGasPrices}
          />,
        ]}
      />
    </>
  );
};

export default BlockStats;
