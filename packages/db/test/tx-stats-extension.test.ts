import { Prisma } from "@prisma/client";
import type { TransactionOverallStats } from "@prisma/client";
import { describe, expect } from "vitest";

import { getDateFromISODateTime } from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import { prisma } from "../prisma";
import {
  getElementByAggregableType,
  groupElementsByAggregableType,
  groupElementsByDay,
} from "./helpers/stats";
import { runDailyStatsFunctionsTests } from "./helpers/suites/daily-stats";
import { runOverallStatsFunctionsTests } from "./helpers/suites/overall-stats";

const avgMetrics: (keyof TransactionOverallStats)[] = [
  "avgBlobAsCalldataFee",
  "avgBlobAsCalldataMaxFee",
  "avgBlobFee",
  "avgBlobMaxFee",
  "avgBlobGasPrice",
  "avgMaxBlobGasFee",
] as const;

describe("Transaction Stats Extension", () => {
  runDailyStatsFunctionsTests("transactionDailyStats", {
    async assertStats(datePeriod) {
      const allDailyStats = await prisma.transactionDailyStats.findMany();
      const expectedTransactionsByDay = groupElementsByDay({
        elements: fixtures.getTransactions({ datePeriod }),
        timeFieldName: "blockTimestamp",
      });

      for (const [
        day,
        expectedDayTransactions,
      ] of expectedTransactionsByDay.entries()) {
        const expectedTransactionsByAggregableType =
          groupElementsByAggregableType(expectedDayTransactions);
        const daysStats = allDailyStats.filter(
          (stats) => stats.day.toISOString() === day
        );

        for (const [
          aggregableType,
          expectedTransactions,
        ] of expectedTransactionsByAggregableType.entries()) {
          const stats = getElementByAggregableType(daysStats, aggregableType);

          const formattedDay = getDateFromISODateTime(day);

          expect(
            stats,
            `${aggregableType} daily stats for day ${formattedDay} not created`
          ).toBeDefined();

          if (stats) {
            const expectedStats = calculateStats(expectedTransactions);

            for (const statName_ in expectedStats) {
              const statName = statName_ as keyof typeof expectedStats;
              const isAvg = avgMetrics.includes(statName);

              // Skip these stats as they are not calculated in the daily stats
              if (
                statName === "totalBlobMaxGasFees" ||
                statName === "totalBlobGasPrice"
              ) {
                continue;
              }

              const errorMsg = `${aggregableType} daily stat "${statName}" for day ${formattedDay} mismatch`;
              if (isAvg) {
                expect(stats[statName], errorMsg).toBeCloseTo(
                  expectedStats[statName] as number
                );
              } else {
                expect(stats[statName], errorMsg).toEqual(
                  expectedStats[statName]
                );
              }
            }
          }
        }
      }
    },
  });

  runOverallStatsFunctionsTests("transactionOverallStats", {
    async assertStats(blockNumberRange) {
      const allOverallStats = await prisma.transactionOverallStats.findMany();
      const expectedTransactionsByAggregableType =
        groupElementsByAggregableType(
          fixtures.getTransactions({
            blockNumberRange,
          })
        );

      for (const [
        aggregableType,
        expectedTransactions,
      ] of expectedTransactionsByAggregableType.entries()) {
        const stats = getElementByAggregableType(
          allOverallStats,
          aggregableType
        );

        expect(
          stats,
          `${aggregableType} overall stats not created`
        ).toBeDefined();

        if (stats) {
          const expectedStats = calculateStats(
            expectedTransactions,
            blockNumberRange
          );

          for (const statName_ in expectedStats) {
            const statName = statName_ as keyof typeof expectedStats;
            const errorMsg = `${aggregableType} overall stat "${statName}" mismatch`;
            const isAvg = avgMetrics.includes(statName);

            if (isAvg) {
              expect(stats[statName], errorMsg).toBeCloseTo(
                expectedStats[statName] as number
              );
            } else {
              expect(stats[statName], errorMsg).toEqual(
                expectedStats[statName]
              );
            }
          }
        }
      }
    },
  });
});

function calculateStats(
  transactions: ReturnType<typeof fixtures.getTransactions>,
  blockNumberRange?: { from: number; to: number }
): Omit<TransactionOverallStats, "id" | "category" | "rollup" | "updatedAt"> {
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
