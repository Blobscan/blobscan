import { describe, it, expect, beforeAll } from "vitest";

import { fixtures, omitDBTimestampFields } from "@blobscan/test";

import type { DatePeriod } from "../../prisma";
import { normalizeDatePeriod } from "../../prisma";
import { prisma } from "../../prisma";
import {
  createNewData,
  dayToDatePeriod,
  getDailyBlobs,
  getDailyBlocks,
  getDailyStatsPrismaModel,
  getDailyTransactions,
  getOverallStatsPrismaModel,
} from "./stats-extension.test.utils";

function runDailyStatsFunctionsTests(
  modelName: keyof typeof prisma,
  {
    runStatsCalculationTests,
  }: {
    runStatsCalculationTests?: (dayPeriod: DatePeriod) => void;
  }
) {
  return describe("Daily stats functions", () => {
    const singleDayDatePeriod: DatePeriod = dayToDatePeriod("2023-08-31");
    const prismaModel = getDailyStatsPrismaModel(modelName);

    describe("fill", () => {
      async function checkStats(datePeriod: DatePeriod) {
        await prismaModel.fill(normalizeDatePeriod(datePeriod));

        const stats = await prismaModel.findMany({
          orderBy: {
            day: "asc",
          },
        });

        expect(stats).toMatchSnapshot();
      }

      if (runStatsCalculationTests) {
        describe("when filling in the stats for a single day", () => {
          runStatsCalculationTests(singleDayDatePeriod);
        });
      }

      it("should fill in stats for a multiple days period", async () => {
        await checkStats({
          from: "2023-08-24",
          to: "2023-09-01",
        });
      });

      it("should fill in stats for a period that doesn't have a starting date", async () => {
        await checkStats({
          to: "2023-08-24",
        });
      });

      it("should fill in stats for a period that doesn't have an ending date", async () => {
        await checkStats({
          from: "2023-08-24",
        });
      });

      it("should fill in stats for a period with no data", async () => {
        await checkStats({
          from: "2099-01-01",
          to: "2099-12-31",
        });
      });
    });

    describe("deleteAll", async () => {
      it("should delete all stats correctly", async () => {
        await prismaModel.fill(singleDayDatePeriod);

        await prismaModel.deleteAll();

        const dailyStats = await prismaModel.findMany({
          orderBy: { day: "asc" },
        });

        expect(dailyStats).toHaveLength(0);
      });
    });
  });
}

function runOverallStatsFunctionsTests(
  modelName: keyof typeof prisma,
  { runStatsCalculationTests }: { runStatsCalculationTests?: () => void }
) {
  return describe("Overall stats functions", () => {
    const prismaModel = getOverallStatsPrismaModel(modelName);

    if (runStatsCalculationTests) {
      describe("backfill", () => {
        describe("when aggregating overall stats", () => {
          runStatsCalculationTests();
        });

        it("should backfill stats after adding new items correctly", async () => {
          await prismaModel.backfill();
          await createNewData();
          await prismaModel.backfill();

          const result = await prismaModel
            .findFirst()
            .then((res) => (res ? omitDBTimestampFields(res) : res));

          expect(result).toMatchSnapshot();
        });
      });

      describe("increment", () => {
        it("should increment stats given a block range correctly", async () => {
          await prismaModel.backfill();
          await createNewData();
          await prismaModel.backfill();

          const result = await prismaModel
            .findFirst()
            .then((res) => (res ? omitDBTimestampFields(res) : res));

          expect(result).toMatchSnapshot();
        });

        it("should update already existing stats correctly", async () => {
          await prismaModel.increment({ from: 1000, to: 1001 });
          await createNewData();
          await prismaModel.increment({ from: 1000, to: 1001 });

          const result = await prismaModel
            .findFirst()
            .then((res) => (res ? omitDBTimestampFields(res) : res));

          expect(result).toMatchSnapshot();
        });
      });
    }
  });
}

describe("Stats Extension", () => {
  const fixtureBlobs = fixtures.blobsOnTransactions.map((btx) => {
    const blob = fixtures.blobs.find(
      (blob) => blob.versionedHash === btx.blobHash
    );

    if (!blob) throw new Error(`Blob with id ${btx.blobHash} not found`);

    return blob;
  });

  describe("Blob model", () => {
    runDailyStatsFunctionsTests("blobDailyStats", {
      runStatsCalculationTests(dayPeriod: DatePeriod) {
        let expectedDailyBlobs: typeof fixtureBlobs;
        let blobDailyStats: NonNullable<
          Awaited<ReturnType<typeof prisma.blobDailyStats.findFirst>>
        >;

        beforeAll(async () => {
          expectedDailyBlobs = getDailyBlobs(dayPeriod);

          await prisma.blobDailyStats.fill(dayPeriod);

          blobDailyStats = await prisma.blobDailyStats
            .findFirst()
            .then((res) => {
              if (!res) {
                throw new Error("Blob daily stats not found");
              }

              return res;
            });
        });

        it("should calculate the total amount of blobs correctly", () => {
          const expectedTotalBlobs = expectedDailyBlobs.length;

          expect(blobDailyStats.totalBlobs).toBe(expectedTotalBlobs);
        });

        it("should calculate the total amount of unique blobs correctly", () => {
          const expectedTotalUniqueBlobs = new Set(
            expectedDailyBlobs.map((b) => b.versionedHash)
          ).size;

          expect(blobDailyStats.totalUniqueBlobs).toBe(
            expectedTotalUniqueBlobs
          );
        });

        it("should calculate the total blob size correctly", () => {
          const expectedTotalBlobSize = expectedDailyBlobs.reduce(
            (acc, b) => acc + b.size,
            0
          );

          expect(blobDailyStats.totalBlobSize).toBe(
            BigInt(expectedTotalBlobSize)
          );
        });

        it("should calculate the average blob size correctly", () => {
          const expectedAvgBlobSize =
            expectedDailyBlobs.reduce((acc, b) => acc + b.size, 0) /
            expectedDailyBlobs.length;

          expect(blobDailyStats.avgBlobSize).toBe(expectedAvgBlobSize);
        });
      },
    });

    runOverallStatsFunctionsTests("blobOverallStats", {
      runStatsCalculationTests() {
        let blobOverallStats: NonNullable<
          Awaited<ReturnType<typeof prisma.blobOverallStats.findFirst>>
        >;

        beforeAll(async () => {
          await prisma.blobOverallStats.backfill();
          const res = await prisma.blobOverallStats.findFirst();

          if (!res) {
            throw new Error("Blob daily stats not found");
          }

          blobOverallStats = res;
        });

        it("should calculate the total amount of blobs correctly", async () => {
          const expectedTotalBlobs = fixtures.blobsOnTransactions.length;

          expect(blobOverallStats.totalBlobs).toBe(expectedTotalBlobs);
        });

        it("should calculate the total amount of unique blobs correctly", async () => {
          const expectedTotalUniqueBlobs = fixtures.blobs.length;

          expect(blobOverallStats.totalUniqueBlobs).toBe(
            expectedTotalUniqueBlobs
          );
        });

        it("should calculate the total blob size correctly", async () => {
          const expectedTotalBlobSize = fixtureBlobs.reduce(
            (acc, b) => acc + b.size,
            0
          );

          expect(blobOverallStats.totalBlobSize).toBe(
            BigInt(expectedTotalBlobSize)
          );
        });

        it("should calculate the average blob size correctly", async () => {
          const expectedTotalBlobSize = fixtureBlobs.reduce(
            (acc, btx) => acc + btx.size,
            0
          );
          const expectedAvgBlobSize =
            expectedTotalBlobSize / fixtures.blobsOnTransactions.length;

          expect(blobOverallStats.avgBlobSize).toBe(expectedAvgBlobSize);
        });
      },
    });
  });

  describe("Block model", () => {
    runDailyStatsFunctionsTests("blockDailyStats", {
      runStatsCalculationTests(dayPeriod) {
        let expectedDailyBlocks: typeof fixtures.blocks;
        let expectedDailyTxs: typeof fixtures.txs;

        let blockDailyStats: NonNullable<
          Awaited<ReturnType<typeof prisma.blockDailyStats.findFirst>>
        >;

        beforeAll(async () => {
          expectedDailyBlocks = getDailyBlocks(dayPeriod);
          expectedDailyTxs = getDailyTransactions(dayPeriod);

          await prisma.blockDailyStats.fill(dayPeriod);

          blockDailyStats = await prisma.blockDailyStats
            .findFirst()
            .then((res) => {
              if (!res) {
                throw new Error("Blob daily stats not found");
              }

              return res;
            });
        });

        it("should calculate the average blob as calldata fee correctly", () => {
          const expectedAvgBlobAsCalldataFee =
            expectedDailyBlocks.reduce(
              (acc, b) => acc + b.blobAsCalldataGasUsed * b.blobGasPrice,
              0
            ) / expectedDailyBlocks.length;

          expect(blockDailyStats.avgBlobAsCalldataFee).toBe(
            expectedAvgBlobAsCalldataFee
          );
        });

        it("should calculate the average blob fee correctly", () => {
          const expectedAvgBlobFee =
            expectedDailyBlocks.reduce(
              (acc, b) => acc + b.blobGasUsed * b.blobGasPrice,
              0
            ) / expectedDailyBlocks.length;

          expect(blockDailyStats.avgBlobFee).toBe(expectedAvgBlobFee);
        });

        it("should calculate the average blob gas price correctly", () => {
          const expectedAvgBlobGasPrice =
            expectedDailyBlocks.reduce((acc, b) => acc + b.blobGasPrice, 0) /
            expectedDailyBlocks.length;

          expect(blockDailyStats.avgBlobGasPrice).toBe(expectedAvgBlobGasPrice);
        });

        // TODO: Fix this calculation
        it.skip("should calculate the total blob as calldata fee correctly", () => {
          const res = expectedDailyTxs.reduce(
            (acc, tx) => acc + tx.gasPrice * tx.blobAsCalldataGasUsed,
            0
          );

          expect(blockDailyStats.totalBlobAsCalldataFee).toBe(BigInt(res));
        });

        it("should calculate the total blob as calldata gas used correctly", () => {
          const expectedTotalBlobAsCalldataGasUsed = expectedDailyBlocks.reduce(
            (acc, b) => acc + b.blobAsCalldataGasUsed,
            0
          );

          expect(blockDailyStats.totalBlobAsCalldataGasUsed).toBe(
            BigInt(expectedTotalBlobAsCalldataGasUsed)
          );
        });

        it("should calculate the total blob fee correctly", () => {
          const expectedTotalBlobFee = expectedDailyBlocks.reduce(
            (acc, b) => acc + b.blobGasUsed * b.blobGasPrice,
            0
          );

          expect(blockDailyStats.totalBlobFee).toBe(
            BigInt(expectedTotalBlobFee)
          );
        });

        it("should calculate the total blob gas used correctly", () => {
          const expectedTotalBlobGasUsed = expectedDailyBlocks.reduce(
            (acc, b) => acc + b.blobGasUsed,
            0
          );

          expect(blockDailyStats.totalBlobGasUsed).toBe(
            BigInt(expectedTotalBlobGasUsed)
          );
        });

        it("should calculate the total blocks correctly", () => {
          const expectedTotalBlocks = expectedDailyBlocks.length;

          expect(blockDailyStats.totalBlocks).toBe(expectedTotalBlocks);
        });
      },
    });

    runOverallStatsFunctionsTests("blockOverallStats", {
      runStatsCalculationTests() {
        const blocks = fixtures.blocks;
        let overallStats: NonNullable<
          Awaited<ReturnType<typeof prisma.blockOverallStats.findFirst>>
        >;

        beforeAll(async () => {
          await prisma.blockOverallStats.backfill();

          overallStats = await prisma.blockOverallStats
            .findFirst()
            .then((res) => {
              if (!res) {
                throw new Error("Blob daily stats not found");
              }

              return res;
            });
        });

        // TODO: Fix this calculation
        it("should calculate the average blob as calldata fee correctly");

        it("should calculate the average blob fee correctly", () => {
          const expectedAvgBlobFee =
            blocks.reduce((acc, b) => acc + b.blobGasUsed * b.blobGasPrice, 0) /
            blocks.length;

          expect(overallStats.avgBlobFee).toBe(expectedAvgBlobFee);
        });

        it("should calculate the average blob gas price correctly", () => {
          const expectedAvgBlobGasPrice =
            blocks.reduce((acc, b) => acc + b.blobGasPrice, 0) / blocks.length;

          expect(overallStats.avgBlobGasPrice).toBe(expectedAvgBlobGasPrice);
        });

        // TODO: Fix this calculation
        it("should calculate the total blob as calldata fee correctly");

        it("should calculate the total blob as calldata gas used correctly", () => {
          const expectedTotalBlobAsCalldataGasUsed = blocks.reduce(
            (acc, b) => acc + b.blobAsCalldataGasUsed,
            0
          );

          expect(overallStats.totalBlobAsCalldataGasUsed.toNumber()).toBe(
            expectedTotalBlobAsCalldataGasUsed
          );
        });

        it("should calculate the total blob fee correctly", () => {
          const expectedTotalBlobFee = blocks.reduce(
            (acc, b) => acc + b.blobGasUsed * b.blobGasPrice,
            0
          );

          expect(overallStats.totalBlobFee.toNumber()).toBe(
            expectedTotalBlobFee
          );
        });

        it("should calculate the total blob gas used correctly", () => {
          const expectedTotalBlobGasUsed = blocks.reduce(
            (acc, b) => acc + b.blobGasUsed,
            0
          );

          expect(overallStats.totalBlobGasUsed.toNumber()).toBe(
            expectedTotalBlobGasUsed
          );
        });

        it("should calculate the total blocks correctly", () => {
          const expectedTotalBlocks = blocks.length;

          expect(overallStats.totalBlocks).toBe(expectedTotalBlocks);
        });
      },
    });
  });

  describe("Transaction model", () => {
    runDailyStatsFunctionsTests("transactionDailyStats", {
      runStatsCalculationTests(dayPeriod) {
        let expectedDailyTransactions: typeof fixtures.txs;
        let transactionDailyStats: NonNullable<
          Awaited<ReturnType<typeof prisma.transactionDailyStats.findFirst>>
        >;

        beforeAll(async () => {
          expectedDailyTransactions = getDailyTransactions(dayPeriod);

          await prisma.transactionDailyStats.fill(dayPeriod);

          transactionDailyStats = await prisma.transactionDailyStats
            .findFirst()
            .then((res) => {
              if (!res) {
                throw new Error("Blob daily stats not found");
              }

              return res;
            });
        });

        it("should calculate the average max fee per blob gas correctly", () => {
          const expectedAvgMaxBlobGasFee =
            expectedDailyTransactions.reduce(
              (acc, tx) => acc + tx.maxFeePerBlobGas,
              0
            ) / expectedDailyTransactions.length;

          expect(transactionDailyStats.avgMaxBlobGasFee).toBe(
            expectedAvgMaxBlobGasFee
          );
        });

        it("should calculate the total transactions correctly", () => {
          const expectedTotalTransactions = expectedDailyTransactions.length;

          expect(transactionDailyStats.totalTransactions).toBe(
            expectedTotalTransactions
          );
        });

        it("should calculate the total unique receivers correctly", () => {
          const expectedTotalUniqueReceivers = new Set(
            expectedDailyTransactions.map((tx) => tx.toId)
          ).size;

          expect(transactionDailyStats.totalUniqueReceivers).toBe(
            expectedTotalUniqueReceivers
          );
        });

        it("should calculate the total unique senders correctly", () => {
          const expectedTotalUniqueSenders = new Set(
            expectedDailyTransactions.map((tx) => tx.fromId)
          ).size;

          expect(transactionDailyStats.totalUniqueSenders).toBe(
            expectedTotalUniqueSenders
          );
        });
      },
    });

    describe("Overall stats functions", () => {
      describe("backfill", () => {
        it("should backfill stats correctly", async () => {
          await prisma.transactionOverallStats.backfill();

          const result = await prisma.transactionOverallStats.findMany({
            select: {
              totalTransactions: true,
              totalUniqueReceivers: true,
              totalUniqueSenders: true,
            },
          });
          expect(result).toMatchInlineSnapshot(`
            [
              {
                "totalTransactions": 16,
                "totalUniqueReceivers": 4,
                "totalUniqueSenders": 4,
              },
            ]
          `);
        });

        // it("should backfill stats after adding new items correctly", async () => {
        //   await prisma.transactionOverallStats.backfill();
        //   await createTransactions();
        //   await prisma.transactionOverallStats.backfill();

        //   const result = await prisma.transactionOverallStats.findMany({
        //     select: {
        //       totalTransactions: true,
        //       totalUniqueReceivers: true,
        //       totalUniqueSenders: true,
        //     },
        //   });
        //   expect(result).toMatchInlineSnapshot(`
        //     [
        //       {
        //         "totalTransactions": 8,
        //         "totalUniqueReceivers": 5,
        //         "totalUniqueSenders": 6,
        //       },
        //     ]
        //   `);
        // });
      });
    });
  });
  // TODO: check for different kind of date input formats
});
