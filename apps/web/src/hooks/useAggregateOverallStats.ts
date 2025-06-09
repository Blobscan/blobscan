import { useMemo } from "react";

import type { OverallStats, Rollup } from "~/types";

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

    return selectedOverallStats.reduce(
      (acc, s) => {
        acc.avgBlobAsCalldataFee =
          acc.avgBlobAsCalldataFee === 0
            ? s.avgBlobAsCalldataFee
            : (acc.avgBlobAsCalldataFee + s.avgBlobAsCalldataFee) / 2;
        acc.avgBlobAsCalldataMaxFee =
          acc.avgBlobAsCalldataMaxFee === 0
            ? s.avgBlobAsCalldataMaxFee
            : (acc.avgBlobAsCalldataMaxFee + s.avgBlobAsCalldataMaxFee) / 2;
        acc.avgBlobFee =
          acc.avgBlobFee === 0
            ? s.avgBlobFee
            : (acc.avgBlobFee + s.avgBlobFee) / 2;
        acc.avgBlobGasPrice =
          acc.avgBlobGasPrice === 0
            ? s.avgBlobGasPrice
            : (acc.avgBlobGasPrice + s.avgBlobGasPrice) / 2;
        acc.avgBlobMaxFee =
          acc.avgBlobMaxFee === 0
            ? s.avgBlobMaxFee
            : (acc.avgBlobMaxFee + s.avgBlobMaxFee) / 2;
        acc.avgMaxBlobGasFee =
          acc.avgMaxBlobGasFee === 0
            ? s.avgMaxBlobGasFee
            : (acc.avgMaxBlobGasFee + s.avgMaxBlobGasFee) / 2;
        acc.totalBlobAsCalldataFee += s.totalBlobAsCalldataFee;
        acc.totalBlobAsCalldataGasUsed += s.totalBlobAsCalldataGasUsed;
        acc.totalBlobAsCalldataMaxFees += s.totalBlobAsCalldataMaxFees;
        acc.totalBlobGasPrice += s.totalBlobGasPrice;
        acc.totalBlobFee += s.totalBlobFee;
        acc.totalBlobGasUsed += s.totalBlobGasUsed;
        acc.totalBlobMaxFees += s.totalBlobMaxFees;
        acc.totalBlobMaxGasFees += s.totalBlobMaxGasFees;
        acc.totalBlobs += s.totalBlobs;
        acc.totalBlobSize += s.totalBlobSize;
        acc.totalBlocks += s.totalBlocks;
        acc.totalTransactions += s.totalTransactions;
        acc.totalUniqueBlobs += s.totalUniqueBlobs;
        acc.totalUniqueReceivers += s.totalUniqueReceivers;
        acc.totalUniqueSenders += s.totalUniqueSenders;

        return acc;
      },
      {
        category: null,
        rollup: null,
        avgBlobAsCalldataFee: 0,
        avgBlobAsCalldataMaxFee: 0,
        avgBlobFee: 0,
        avgBlobGasPrice: 0,
        avgBlobMaxFee: 0,
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
        totalBlocks: 0,
        totalTransactions: 0,
        totalUniqueBlobs: 0,
        totalUniqueReceivers: 0,
        totalUniqueSenders: 0,
      } satisfies Omit<OverallStats, "updatedAt">
    );
  }, [overallStats, selectedRollups]);
}
