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
      return overallStats.find((s) => s.dimension.type === "global")?.metrics;
    }

    const selectedOverallStats = overallStats.filter(({ dimension }) =>
      dimension.type === "rollup" && dimension.name
        ? selectedRollups.includes(dimension.name as Rollup)
        : false
    );

    const aggregations = selectedOverallStats.reduce(
      (aggr, { metrics }) => {
        aggr.totalBlobAsCalldataFee += metrics.totalBlobAsCalldataFee;
        aggr.totalBlobAsCalldataGasUsed += metrics.totalBlobAsCalldataGasUsed;
        aggr.totalBlobAsCalldataMaxFees += metrics.totalBlobAsCalldataMaxFees;
        aggr.totalBlobGasPrice += metrics.totalBlobGasPrice;
        aggr.totalBlobFee += metrics.totalBlobFee;
        aggr.totalBlobGasUsed += metrics.totalBlobGasUsed;
        aggr.totalBlobMaxFees += metrics.totalBlobMaxFees;
        aggr.totalBlobMaxGasFees += metrics.totalBlobMaxGasFees;
        aggr.totalBlobs += metrics.totalBlobs;
        aggr.totalBlobSize += metrics.totalBlobSize;
        aggr.totalBlobUsageSize += metrics.totalBlobUsageSize;
        aggr.totalBlocks += metrics.totalBlocks;
        aggr.totalTransactions += metrics.totalTransactions;
        aggr.totalUniqueBlobs += metrics.totalUniqueBlobs;
        aggr.totalUniqueReceivers += metrics.totalUniqueReceivers;
        aggr.totalUniqueSenders += metrics.totalUniqueSenders;

        return aggr;
      },
      {
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
      } satisfies OverallStats["metrics"]
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
