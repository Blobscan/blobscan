import { Prisma } from "@prisma/client";
import type { OverallStats } from "@prisma/client";
import { beforeEach, describe, expect, it } from "vitest";

import type { DatePeriodLike } from "@blobscan/dayjs";
import dayjs, {
  getDateFromISODateTime,
  MIN_DATE,
  toDailyDate,
  toDailyDatePeriod,
} from "@blobscan/dayjs";
import { fixtures } from "@blobscan/test";

import { getPrisma } from "../../prisma";
import type { BlockNumberRange } from "../../prisma/types";
import {
  getElementByAggregableType,
  groupElementsByAggregableType,
  groupElementsByDay,
  indexBlock,
} from "./stats.utils";

const AVG_METRICS: (keyof OverallStats)[] = [
  "avgBlobAsCalldataFee",
  "avgBlobAsCalldataMaxFee",
  "avgBlobFee",
  "avgBlobMaxFee",
  "avgBlobGasPrice",
  "avgMaxBlobGasFee",
  "avgBlobUsageSize",
] as const;

describe("Stats Extension", () => {
  const prisma = getPrisma();
  describe("Daily Stats Model", () => {
    async function assertDailyStats(datePeriod: DatePeriodLike) {
      const allDailyStats = await prisma.dailyStats.findMany();
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
              const isAvg = AVG_METRICS.includes(statName);

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
    }

    async function assertAggregatedDays(datePeriodLike?: DatePeriodLike) {
      const { from = MIN_DATE, to = new Date() } = datePeriodLike
        ? toDailyDatePeriod(datePeriodLike)
        : {};
      const datePeriod = { from, to };

      await prisma.dailyStats.aggregate(datePeriod);

      const statsDays = (
        await prisma.dailyStats.findMany({
          orderBy: {
            day: "asc",
          },
        })
      ).map(({ day }) => day);
      const nonDuplicateStatsDays = Array.from(
        new Set(
          statsDays
            .map((d) => d.toISOString())
            .sort((a, b) => a.localeCompare(b))
        )
      );

      const txs = fixtures.getTransactions({ datePeriod });
      const elementTimestamps = txs.map(({ blockTimestamp }) => blockTimestamp);
      const expectedAggregatedDays = Array.from(
        elementTimestamps.reduce<Set<string>>((days, timestamp) => {
          if (dayjs(timestamp).isBetween(datePeriod.from, datePeriod.to)) {
            days.add(toDailyDate(timestamp, "startOf").toISOString());
          }

          return days;
        }, new Set<string>())
      ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      expect(nonDuplicateStatsDays, "Days aggregated mismatch").toEqual(
        expectedAggregatedDays
      );
    }

    describe("aggregate()", () => {
      it("should fill in stats for a single day correctly", async () => {
        const dayPeriod: DatePeriodLike = {
          from: "2023-08-20",
          to: "2023-08-20",
        };

        await prisma.dailyStats.aggregate(dayPeriod);

        await assertDailyStats(dayPeriod);
      });

      it("should fill in stats for several days correctly", async () => {
        const daysPeriod: DatePeriodLike = {
          from: "2023-08-24",
          to: "2023-09-01",
        };

        await prisma.dailyStats.aggregate(daysPeriod);

        await assertDailyStats(daysPeriod);
      });

      describe("when filling in stats for a multiple days period", () => {
        it("should do it correctly when `YYYY-MM-DD` dates are passed", async () => {
          const dayPeriod: DatePeriodLike = {
            from: "2023-08-24",
            to: "2023-09-01",
          };

          await prisma.dailyStats.aggregate(dayPeriod);

          await assertAggregatedDays({
            from: "2023-08-24",
            to: "2023-09-01",
          });
        });
      });

      it("should fill in stats for a period when native `Date` objects are provided", async () => {
        await assertAggregatedDays({
          from: new Date("2023-08-24"),
          to: new Date("2023-09-01"),
        });
      });

      it("should fill in stats for a period when `dayjs` objects are provided", async () => {
        await assertAggregatedDays({
          from: dayjs("2023-08-24"),
          to: dayjs("2023-09-01"),
        });
      });

      it("should fill in stats for a period that doesn't have a starting date", async () => {
        await assertAggregatedDays({
          to: "2023-08-24",
        });
      });

      it("should fill in stats for a period that doesn't have an ending date", async () => {
        await assertAggregatedDays({
          from: "2023-08-24",
        });
      });

      it("should fill in stats up to current date if no period is specified", async () => {
        await assertAggregatedDays();
      });

      it("should fill in stats for a period with no data", async () => {
        await assertAggregatedDays({
          from: "2099-01-01",
          to: "2099-12-31",
        });
      });

      it("should ignore reorged blocks when aggregating stats", async () => {
        await indexBlock({ indexAsReorged: true });

        await assertAggregatedDays({
          from: "2023-09-01",
          to: "2023-09-01",
        });
      });
    });

    describe("erase()", () => {
      const systemDate = dayjs(fixtures.systemDate);
      const stats = [
        {
          day: systemDate.subtract(1, "day").toISOString(),
          category: null,
          rollup: null,
          totalBlocks: 1,
        },
        {
          day: systemDate.subtract(2, "day").toISOString(),
          category: null,
          rollup: null,
          totalBlocks: 2,
        },
      ];

      beforeEach(async () => {
        await prisma.dailyStats.createMany({
          data: stats,
        });
      });

      it("should delete all stats correctly", async () => {
        await prisma.dailyStats.erase();

        const dailyStatsAfter = await prisma.dailyStats.findMany();

        expect(dailyStatsAfter).toHaveLength(0);
      });
    });
  });
  describe("Overall Stats Model", () => {
    async function assertOverallStats(blockNumberRange?: BlockNumberRange) {
      const allOverallStats = await prisma.overallStats.findMany();
      console.log(allOverallStats);
      const expectedElementsByAggregableType = groupElementsByAggregableType(
        fixtures.getTransactions({ blockNumberRange })
      );

      for (const [
        aggregableType,
        expectedTxs,
      ] of expectedElementsByAggregableType.entries()) {
        const stats = getElementByAggregableType(
          allOverallStats,
          aggregableType
        );

        expect(
          stats,
          `${aggregableType} overall stats not created`
        ).toBeDefined();

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
              expect(stats[statName], errorMsg).toEqual(
                expectedStats[statName]
              );
            }
          }
        }
      }
    }

    describe("aggregate()", () => {
      it.only("should increment stats for a specific block range correctly", async () => {
        const blockRange: BlockNumberRange = { from: 1000, to: 1001 };

        await prisma.overallStats.aggregate({ blockRange });

        await assertOverallStats(blockRange);
      });

      it("should increment stats after the first time for a specific block range correctly", async () => {
        const firstBlockRange: BlockNumberRange = { from: 1000, to: 1001 };
        const secondBlockRange: BlockNumberRange = { from: 1002, to: 1003 };

        await prisma.overallStats.aggregate({ blockRange: firstBlockRange });

        await prisma.overallStats.aggregate({ blockRange: secondBlockRange });

        await assertOverallStats({ from: 1000, to: 1003 });
      });

      it("should ignore reorged blocks when incrementing stats", async () => {
        await prisma.overallStats.aggregate({
          blockRange: { from: 1000, to: 1008 },
        });

        await indexBlock({ indexAsReorged: true });

        await prisma.overallStats.aggregate({
          blockRange: { from: 1009, to: 9999 },
        });

        await assertOverallStats();
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
    const totalBlobUsageSize = txBlobs.reduce(
      (acc, b) => acc + BigInt(b.usageSize ?? 0),
      BigInt(0)
    );
    const totalUniqueBlobs = new Set(
      transactions.flatMap((tx) =>
        tx.blobs
          .filter((b) => b.firstBlockNumber === tx.blockNumber)
          .map((b) => b.versionedHash)
      )
    ).size;
    const totalBlocks = new Set(transactions.map((tx) => tx.blockNumber)).size;
    const totalTransactions = transactions.length;
    const totalUniqueReceivers = new Set(
      transactions
        .filter(({ to: { firstBlockNumberAsReceiver } }) =>
          blockNumberRange && firstBlockNumberAsReceiver
            ? firstBlockNumberAsReceiver >= blockNumberRange.from &&
              firstBlockNumberAsReceiver <= blockNumberRange.to
            : true
        )
        .map((tx) => tx.toId)
    ).size;
    const totalUniqueSenders = new Set(
      transactions
        .filter(({ from: { firstBlockNumberAsSender } = {} }) =>
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
    const avgBlobUsageSize = Number(totalBlobUsageSize) / Number(totalBlobs);

    return {
      totalBlobs,
      totalBlobSize,
      totalBlobUsageSize,
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
      avgBlobUsageSize,
      avgMaxBlobGasFee,
    };
  }
});
