import { Prisma } from "@prisma/client";
import type { OverallStats } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import { prisma } from "../prisma";
import type { BlockNumberRange } from "../prisma/types";
import {
  getElementByAggregableType,
  groupElementsByAggregableType,
  indexBlock,
} from "./helpers/stats";

const AVG_METRICS: (keyof OverallStats)[] = [
  "avgBlobAsCalldataFee",
  "avgBlobAsCalldataMaxFee",
  "avgBlobFee",
  "avgBlobMaxFee",
  "avgBlobGasPrice",
  "avgMaxBlobGasFee",
] as const;

async function assertStats(blockNumberRange?: BlockNumberRange) {
  const allOverallStats = await prisma.overallStats.findMany();
  const expectedElementsByAggregableType = groupElementsByAggregableType(
    fixtures.getTransactions({ blockNumberRange })
  );

  for (const [
    aggregableType,
    expectedTxs,
  ] of expectedElementsByAggregableType.entries()) {
    const stats = getElementByAggregableType(allOverallStats, aggregableType);

    expect(stats, `${aggregableType} overall stats not created`).toBeDefined();

    if (stats) {
      const expectedStats = calculateStats(expectedTxs, blockNumberRange);

      for (const statName_ in expectedStats) {
        const statName = statName_ as keyof typeof expectedStats;
        const errorMsg = `${aggregableType} overall stat "${statName}" mismatch`;
        const isAvg = AVG_METRICS.includes(statName);

        if (isAvg) {
          expect(stats[statName], errorMsg).toBeCloseTo(
            expectedStats[statName] as number
          );
        } else {
          expect(stats[statName], errorMsg).toEqual(expectedStats[statName]);
        }
      }
    }
  }
}

describe("Stats Extension", () => {
  describe("Overall Stats Model", () => {
    describe("aggregate()", () => {
      it("should increment stats for a specific block range correctly", async () => {
        const blockRange: BlockNumberRange = { from: 1000, to: 1001 };

        await prisma.overallStats.aggregate({ blockRange });

        await assertStats(blockRange);
      });

      it("should increment stats after the first time for a specific block range correctly", async () => {
        const firstBlockRange: BlockNumberRange = { from: 1000, to: 1001 };
        const secondBlockRange: BlockNumberRange = { from: 1002, to: 1003 };

        await prisma.overallStats.aggregate({ blockRange: firstBlockRange });

        await prisma.overallStats.aggregate({ blockRange: secondBlockRange });

        await assertStats({ from: 1000, to: 1003 });
      });

      it("should ignore reorged blocks when incrementing stats", async () => {
        await prisma.overallStats.aggregate({
          blockRange: { from: 1000, to: 1008 },
        });

        await indexBlock({ indexAsReorged: true });

        await prisma.overallStats.aggregate({
          blockRange: { from: 1009, to: 9999 },
        });

        await assertStats();
      });
    });

    describe("reset()", () => {
      beforeEach(async () => {
        await prisma.overallStats.create({
          data: {
            category: null,
            rollup: null,
            totalBlocks: 1,
            totalTransactions: 1,
            totalBlobs: 1,
          },
        });

        await prisma.blockchainSyncState.upsert({
          create: {
            lastAggregatedBlock: 1,
          },
          update: {
            lastAggregatedBlock: 1,
          },
          where: {
            id: 1,
          },
        });
      });

      it("should delete all stats correctly", async () => {
        await prisma.overallStats.erase();

        const allOverallStats = await prisma.overallStats.findMany();

        expect(allOverallStats).toHaveLength(0);
      });

      it("should set last aggregated block to zero", async () => {
        await prisma.overallStats.erase();

        const blockchainSyncState =
          await prisma.blockchainSyncState.findFirst();

        expect(blockchainSyncState?.lastAggregatedBlock).toBe(0);
      });
    });
  });
});

function calculateStats(
  transactions: ReturnType<typeof fixtures.getTransactions>,
  blockNumberRange?: { from: number; to: number }
): Omit<OverallStats, "id" | "category" | "rollup" | "updatedAt"> {
  const txBlobs = transactions.flatMap((tx) => tx.blobs);
  const totalBlobs = txBlobs.length;
  const totalBlobSize = txBlobs.reduce(
    (acc, b) => acc + BigInt(b.size),
    BigInt(0)
  );
  const totalUniqueBlobs = new Set(
    txBlobs
      .filter(({ firstBlockNumber }) =>
        blockNumberRange && firstBlockNumber
          ? firstBlockNumber >= blockNumberRange.from &&
            firstBlockNumber <= blockNumberRange.to
          : true
      )
      .map(({ versionedHash }) => versionedHash)
  ).size;
  const totalBlocks = new Set(transactions.map((tx) => tx.blockNumber)).size;
  const totalTransactions = transactions.length;
  const totalUniqueReceivers = new Set(
    transactions
      .filter(({ toHistory: { firstBlockNumberAsReceiver } }) =>
        blockNumberRange && firstBlockNumberAsReceiver
          ? firstBlockNumberAsReceiver >= blockNumberRange.from &&
            firstBlockNumberAsReceiver <= blockNumberRange.to
          : true
      )
      .map((tx) => tx.toId)
  ).size;
  const totalUniqueSenders = new Set(
    transactions
      .filter(({ fromHistory: { firstBlockNumberAsSender } }) =>
        blockNumberRange && firstBlockNumberAsSender
          ? firstBlockNumberAsSender >= blockNumberRange.from &&
            firstBlockNumberAsSender <= blockNumberRange.to
          : true
      )
      .map((tx) => tx.fromId)
  ).size;
  const totalBlobGasUsed = new Prisma.Decimal(
    transactions.reduce((acc, tx) => acc + tx.blobGasUsed, 0)
  );
  const totalBlobAsCalldataGasUsed = new Prisma.Decimal(
    transactions.reduce((acc, tx) => acc + tx.blobAsCalldataGasUsed, 0)
  );
  const totalBlobFee = new Prisma.Decimal(
    transactions.reduce(
      (acc, tx) => acc + tx.blobGasUsed * tx.block.blobGasPrice,
      0
    )
  );
  const totalBlobMaxFees = new Prisma.Decimal(
    transactions.reduce(
      (acc, tx) => acc + tx.maxFeePerBlobGas * tx.blobGasUsed,
      0
    )
  );
  const totalBlobAsCalldataFee = new Prisma.Decimal(
    transactions.reduce(
      (acc, tx) => acc + tx.blobAsCalldataGasUsed * tx.block.blobGasPrice,
      0
    )
  );
  const totalBlobAsCalldataMaxFees = new Prisma.Decimal(
    transactions.reduce(
      (acc, tx) => acc + tx.blobAsCalldataGasUsed * tx.maxFeePerBlobGas,
      0
    )
  );
  const totalBlobMaxGasFees = new Prisma.Decimal(
    transactions.reduce((acc, tx) => acc + tx.maxFeePerBlobGas, 0)
  );
  const totalBlobGasPrice = new Prisma.Decimal(
    transactions.reduce((acc, tx) => acc + tx.block.blobGasPrice, 0)
  );
  const avgBlobFee = totalBlobFee.div(totalTransactions).toNumber();
  const avgBlobMaxFee = totalBlobMaxFees.div(totalTransactions).toNumber();
  const avgBlobAsCalldataFee = totalBlobAsCalldataFee
    .div(totalTransactions)
    .toNumber();
  const avgBlobAsCalldataMaxFee = totalBlobAsCalldataMaxFees
    .div(totalTransactions)
    .toNumber();
  const avgBlobGasPrice =
    transactions.reduce((acc, tx) => acc + tx.block.blobGasPrice, 0) /
    totalTransactions;
  const avgMaxBlobGasFee = totalBlobMaxGasFees
    .div(totalTransactions)
    .toNumber();

  return {
    totalBlobs,
    totalBlobSize,
    totalUniqueBlobs,
    totalBlocks,
    totalTransactions,
    totalUniqueReceivers,
    totalUniqueSenders,
    totalBlobGasUsed,
    totalBlobAsCalldataGasUsed,
    totalBlobFee,
    totalBlobMaxFees,
    totalBlobAsCalldataFee,
    totalBlobAsCalldataMaxFees,
    totalBlobMaxGasFees,
    totalBlobGasPrice,
    avgBlobFee,
    avgBlobMaxFee,
    avgBlobAsCalldataFee,
    avgBlobAsCalldataMaxFee,
    avgBlobGasPrice,
    avgMaxBlobGasFee,
  };
}
