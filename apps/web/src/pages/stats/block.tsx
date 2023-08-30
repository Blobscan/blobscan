import type { NextPage } from "next";
import NextError from "next/error";

import {
  DailyAvgBlobGasPriceChart,
  DailyBlobFeeChart,
  DailyBlobGasUsedChart,
  DailylBlobVsBlobAsCalldataGasUsedChart,
  DailyBlocksChart,
  DailyAvgBlobFeeChart,
} from "~/components/Charts/Block";
import { StatsLayout } from "~/components/Layouts/StatsLayout";
import { api } from "~/api-client";
import { calculatePercentage, formatWei, parseAmountWithUnit } from "~/utils";

const BlockStats: NextPage = function () {
  const { data: dailyBlockStats, error: dailyBlockErr } =
    api.stats.getBlockDailyStats.useQuery({
      timeFrame: "30d",
    });
  const { data: overallBlockStats, error: overallBlockStatsErr } =
    api.stats.getBlockOverallStats.useQuery();

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
            },
          },
          {
            name: "Avg. Blob Gas Price",
            metric: overallBlockStats
              ? {
                  ...parseAmountWithUnit(
                    formatWei(overallBlockStats.avgBlobGasPrice)
                  ),
                  numberFormatOpts: {
                    maximumFractionDigits: 10,
                  },
                }
              : undefined,
          },
          {
            name: "Total Fees Saved",
            metric: overallBlockStats
              ? {
                  ...parseAmountWithUnit(
                    formatWei(
                      overallBlockStats.totalBlobAsCalldataFee -
                        overallBlockStats.totalBlobFee
                    )
                  ),
                }
              : undefined,
          },
          {
            name: "Total Calldata Gas Saved",
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
                    value:
                      100 -
                      calculatePercentage(
                        overallBlockStats.totalBlobGasUsed,
                        overallBlockStats.totalBlobAsCalldataGasUsed
                      ),
                    unit: "%",
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
          <DailylBlobVsBlobAsCalldataGasUsedChart
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
