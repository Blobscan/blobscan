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
import { useTransformResult } from "~/hooks/useTransformResult";
import { transformDailyBlockStatsResult } from "~/query-transformers";
import { calculatePercentage, formatWei, parseAmountWithUnit } from "~/utils";

const BlockStats: NextPage = function () {
  const dailyBlockStatsRes = api.stats.block.getDailyStats.useQuery({
    timeFrame: "30d",
  });
  const overallBlockStatsRes = api.stats.block.getOverallStats.useQuery();
  const dailyBlockStats = useTransformResult(
    dailyBlockStatsRes,
    transformDailyBlockStatsResult
  );

  const blockOverallStats = useTransformResult(overallBlockStatsRes);

  const error = dailyBlockStatsRes.error || overallBlockStatsRes.error;

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
        metrics={
          blockOverallStats
            ? [
                {
                  name: "Total Blocks",
                  metric: {
                    value: blockOverallStats.totalBlocks,
                  },
                },
                {
                  name: "Total Blob Gas Used",
                  metric: {
                    value: blockOverallStats.totalBlobGasUsed,
                  },
                },
                {
                  name: "Total Blob Fees",
                  metric: {
                    value: blockOverallStats.totalBlobFee,
                  },
                },
                {
                  name: "Avg. Blob Gas Price",
                  metric: {
                    ...parseAmountWithUnit(
                      formatWei(blockOverallStats.avgBlobGasPrice)
                    ),
                    numberFormatOpts: {
                      maximumFractionDigits: 10,
                    },
                  },
                },
                {
                  name: "Total Fees Saved",
                  metric: {
                    ...parseAmountWithUnit(
                      formatWei(
                        blockOverallStats.totalBlobAsCalldataFee -
                          blockOverallStats.totalBlobFee
                      )
                    ),
                  },
                },
                {
                  name: "Total Calldata Gas Saved",
                  metric: {
                    value:
                      blockOverallStats.totalBlobAsCalldataGasUsed -
                      blockOverallStats.totalBlobGasUsed,
                  },
                  secondaryMetric: {
                    value:
                      100 -
                      calculatePercentage(
                        blockOverallStats.totalBlobGasUsed,
                        blockOverallStats.totalBlobAsCalldataGasUsed
                      ),
                    unit: "%",
                  },
                },
              ]
            : undefined
        }
        charts={[
          <DailyBlocksChart
            key={0}
            days={dailyBlockStats?.day}
            blocks={dailyBlockStats?.totalBlocks}
          />,
          <DailyBlobGasUsedChart
            key={1}
            days={dailyBlockStats?.day}
            blobGasUsed={dailyBlockStats?.totalBlobGasUsed}
          />,
          <DailylBlobVsBlobAsCalldataGasUsedChart
            key={2}
            days={dailyBlockStats?.day}
            blobGasUsed={dailyBlockStats?.totalBlobGasUsed}
            blobAsCalldataGasUsed={dailyBlockStats?.totalBlobAsCalldataGasUsed}
          />,
          <DailyBlobFeeChart
            key={3}
            days={dailyBlockStats?.day}
            blobFees={dailyBlockStats?.totalBlobFee}
          />,
          <DailyAvgBlobFeeChart
            key={4}
            days={dailyBlockStats?.day}
            avgBlobFees={dailyBlockStats?.avgBlobFee}
          />,
          <DailyAvgBlobGasPriceChart
            key={5}
            days={dailyBlockStats?.day}
            avgBlobGasPrice={dailyBlockStats?.avgBlobGasPrice}
          />,
        ]}
      />
    </>
  );
};

export default BlockStats;
