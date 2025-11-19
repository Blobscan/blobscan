import { useMemo } from "react";

import type { OverallStats, Rollup } from "~/types";
import { performDiv } from "~/utils";

export function useAggregateOverallStats(
  selectedRollups: Rollup[],
  overallStats?: OverallStats[]
) {
  return useMemo(() => {
    if (!overallStats) {
      return;
    }

    if (!selectedRollups.length) {
      return overallStats.find((s) => s.category === null && s.rollup === null);
    }

    const selectedOverallStats = overallStats.filter((s) =>
      s.rollup !== null ? selectedRollups.includes(s.rollup) : false
    );

    const aggregations = selectedOverallStats.reduce(
      (aggr, s) => {
        aggr.totalBlobAsCalldataFee += s.totalBlobAsCalldataFee;
        aggr.totalBlobAsCalldataGasUsed += s.totalBlobAsCalldataGasUsed;
        aggr.totalBlobAsCalldataMaxFees += s.totalBlobAsCalldataMaxFees;
        aggr.totalBlobGasPrice += s.totalBlobGasPrice;
        aggr.totalBlobFee += s.totalBlobFee;
        aggr.totalBlobGasUsed += s.totalBlobGasUsed;
        aggr.totalBlobMaxFees += s.totalBlobMaxFees;
        aggr.totalBlobMaxGasFees += s.totalBlobMaxGasFees;
        aggr.totalBlobs += s.totalBlobs;
        aggr.totalBlobSize += s.totalBlobSize;
        aggr.totalBlobUsageSize += s.totalBlobUsageSize;
        aggr.totalBlocks += s.totalBlocks;
        aggr.totalTransactions += s.totalTransactions;
        aggr.totalUniqueBlobs += s.totalUniqueBlobs;
        aggr.totalUniqueReceivers += s.totalUniqueReceivers;
        aggr.totalUniqueSenders += s.totalUniqueSenders;

        return aggr;
      },
      {
        category: null,
        rollup: null,
        avgBlobAsCalldataFee: 0,
        avgBlobAsCalldataMaxFee: 0,
        avgBlobFee: 0,
        avgBlobGasPrice: 0,
        avgBlobMaxFee: 0,
        avgBlobUsageSize: 0,
        avgMaxBlobGasFee: 0,
        totalBlobAsCalldataFee: BigInt(0),
        totalBlobAsCalldataGasUsed: BigInt(0),
        totalBlobAsCalldataMaxFees: BigInt(0),
        totalBlobGasPrice: BigInt(0),
        totalBlobFee: BigInt(0),
        totalBlobGasUsed: BigInt(0),
        totalBlobMaxFees: BigInt(0),
        totalBlobMaxGasFees: BigInt(0),
        totalBlobs: 0,
        totalBlobSize: BigInt(0),
        totalBlobUsageSize: BigInt(0),
        totalBlocks: 0,
        totalTransactions: 0,
        totalUniqueBlobs: 0,
        totalUniqueReceivers: 0,
        totalUniqueSenders: 0,
      } satisfies Omit<OverallStats, "updatedAt">
    );

    const totalBlobs = BigInt(aggregations.totalBlobs);
    if (totalBlobs > 0) {
      aggregations.avgBlobFee = performDiv(
        aggregations.totalBlobFee,
        totalBlobs
      );
      aggregations.avgBlobMaxFee = performDiv(
        aggregations.totalBlobMaxFees,
        totalBlobs
      );
      aggregations.avgBlobAsCalldataFee = performDiv(
        aggregations.totalBlobAsCalldataFee,
        totalBlobs
      );
      aggregations.avgBlobAsCalldataMaxFee = performDiv(
        aggregations.totalBlobAsCalldataMaxFees,
        totalBlobs
      );
      aggregations.avgBlobGasPrice = performDiv(
        aggregations.totalBlobGasPrice,
        totalBlobs
      );
      aggregations.avgBlobUsageSize = performDiv(
        aggregations.totalBlobUsageSize,
        totalBlobs
      );
      aggregations.avgMaxBlobGasFee = performDiv(
        aggregations.totalBlobMaxGasFees,
        totalBlobs
      );
    }

    return aggregations;
  }, [overallStats, selectedRollups]);
}
