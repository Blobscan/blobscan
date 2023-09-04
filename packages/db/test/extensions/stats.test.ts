import { describe, it, expect } from "vitest";

import { prisma } from "../../prisma";
import { createBlobs, createBlocks, createTransactions } from "../helpers";

describe("Stats Extension", () => {
  // TODO: check for different kind of date input formats
  describe("Daily Stats", () => {
    describe("Blob model", () => {
      it("should fill stats in a date period", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 1100,
              "day": 2023-08-24T00:00:00.000Z,
              "totalBlobSize": 3300n,
              "totalBlobs": 3,
              "totalUniqueBlobs": 3,
            },
            {
              "avgBlobSize": 1400,
              "day": 2023-08-26T00:00:00.000Z,
              "totalBlobSize": 4200n,
              "totalBlobs": 3,
              "totalUniqueBlobs": 3,
            },
          ]
        `);
      });

      it("should fill stats to date", async () => {
        await prisma.blobDailyStats.fill({
          to: "2023-08-25",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 1100,
              "day": 2023-08-24T00:00:00.000Z,
              "totalBlobSize": 3300n,
              "totalBlobs": 3,
              "totalUniqueBlobs": 3,
            },
          ]
        `);
      });

      it("should fill stats from date", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-26",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 1400,
              "day": 2023-08-26T00:00:00.000Z,
              "totalBlobSize": 4200n,
              "totalBlobs": 3,
              "totalUniqueBlobs": 3,
            },
          ]
        `);
      });

      it("should not fill stats if no data during that date", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-28",
          to: "2023-08-30",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toHaveLength(0);
      });

      it("should update stats for a date with new data", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        await createBlobs();

        await prisma.blobDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const resultAfter = await prisma.blobDailyStats.findMany();

        expect(resultAfter).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 860,
              "day": 2023-08-24T00:00:00.000Z,
              "totalBlobSize": 4300n,
              "totalBlobs": 5,
              "totalUniqueBlobs": 5,
            },
            {
              "avgBlobSize": 1400,
              "day": 2023-08-26T00:00:00.000Z,
              "totalBlobSize": 4200n,
              "totalBlobs": 3,
              "totalUniqueBlobs": 3,
            },
          ]
        `);
      });

      it("should delete all stats", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const stats = await prisma.blobDailyStats.findMany();
        expect(stats).toHaveLength(2);

        await prisma.blobDailyStats.deleteMany();

        const statsAfter = await prisma.blobDailyStats.findMany();
        expect(statsAfter).toHaveLength(0);
      });
    });

    describe("Block model", () => {
      it("should fill stats in a date period", async () => {
        await prisma.blockDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const result = await prisma.blockDailyStats.findMany({
          orderBy: {
            day: "asc",
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobAsCalldataFee": 5000000,
              "avgBlobFee": 100000000,
              "avgBlobGasPrice": 20,
              "day": 2023-08-24T00:00:00.000Z,
              "totalBlobAsCalldataFee": 5000000n,
              "totalBlobAsCalldataGasUsed": 250000n,
              "totalBlobFee": 100000000n,
              "totalBlobGasUsed": 5000000n,
              "totalBlocks": 1,
            },
            {
              "avgBlobAsCalldataFee": 5610000,
              "avgBlobFee": 121000000,
              "avgBlobGasPrice": 22,
              "day": 2023-08-26T00:00:00.000Z,
              "totalBlobAsCalldataFee": 5610000n,
              "totalBlobAsCalldataGasUsed": 255000n,
              "totalBlobFee": 121000000n,
              "totalBlobGasUsed": 5500000n,
              "totalBlocks": 1,
            },
          ]
        `);
      });

      it("should fill stats to date", async () => {
        await prisma.blockDailyStats.fill({
          to: "2023-08-25",
        });

        const result = await prisma.blockDailyStats.findMany();
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobAsCalldataFee": 5000000,
              "avgBlobFee": 100000000,
              "avgBlobGasPrice": 20,
              "day": 2023-08-24T00:00:00.000Z,
              "totalBlobAsCalldataFee": 5000000n,
              "totalBlobAsCalldataGasUsed": 250000n,
              "totalBlobFee": 100000000n,
              "totalBlobGasUsed": 5000000n,
              "totalBlocks": 1,
            },
          ]
        `);
      });

      it("should fill stats from date", async () => {
        await prisma.blockDailyStats.fill({
          from: "2023-08-26",
        });

        const result = await prisma.blockDailyStats.findMany();
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobAsCalldataFee": 5610000,
              "avgBlobFee": 121000000,
              "avgBlobGasPrice": 22,
              "day": 2023-08-26T00:00:00.000Z,
              "totalBlobAsCalldataFee": 5610000n,
              "totalBlobAsCalldataGasUsed": 255000n,
              "totalBlobFee": 121000000n,
              "totalBlobGasUsed": 5500000n,
              "totalBlocks": 1,
            },
          ]
        `);
      });

      it("should not fill stats if no data during that date", async () => {
        await prisma.blockDailyStats.fill({
          from: "2023-08-28",
          to: "2023-08-30",
        });

        const result = await prisma.blockDailyStats.findMany();
        expect(result).toHaveLength(0);
      });

      it("should update stats for a date with new data", async () => {
        await prisma.blockDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        await createBlocks();

        await prisma.blockDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const resultAfter = await prisma.blockDailyStats.findMany();

        expect(resultAfter).toMatchInlineSnapshot(`
          [
            {
              "avgBlobAsCalldataFee": 5000000,
              "avgBlobFee": 100000000,
              "avgBlobGasPrice": 20,
              "day": 2023-08-24T00:00:00.000Z,
              "totalBlobAsCalldataFee": 5000000n,
              "totalBlobAsCalldataGasUsed": 250000n,
              "totalBlobFee": 100000000n,
              "totalBlobGasUsed": 5000000n,
              "totalBlocks": 1,
            },
            {
              "avgBlobAsCalldataFee": 5610000,
              "avgBlobFee": 121000000,
              "avgBlobGasPrice": 22,
              "day": 2023-08-25T00:00:00.000Z,
              "totalBlobAsCalldataFee": 5610000n,
              "totalBlobAsCalldataGasUsed": 255000n,
              "totalBlobFee": 121000000n,
              "totalBlobGasUsed": 5500000n,
              "totalBlocks": 1,
            },
            {
              "avgBlobAsCalldataFee": 5305000,
              "avgBlobFee": 110500000,
              "avgBlobGasPrice": 21,
              "day": 2023-08-26T00:00:00.000Z,
              "totalBlobAsCalldataFee": 10610000n,
              "totalBlobAsCalldataGasUsed": 505000n,
              "totalBlobFee": 221000000n,
              "totalBlobGasUsed": 10500000n,
              "totalBlocks": 2,
            },
          ]
        `);
      });

      it("should delete all stats", async () => {
        await prisma.blockDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const stats = await prisma.blockDailyStats.findMany();
        expect(stats).toHaveLength(2);

        await prisma.blockDailyStats.deleteMany();

        const statsAfter = await prisma.blockDailyStats.findMany();
        expect(statsAfter).toHaveLength(0);
      });
    });

    describe("Transaction model", () => {
      it("should fill stats in a date period", async () => {
        await prisma.transactionDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const result = await prisma.transactionDailyStats.findMany({
          orderBy: {
            day: "asc",
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgMaxBlobGasFee": 110,
              "day": 2023-08-24T00:00:00.000Z,
              "totalTransactions": 3,
              "totalUniqueReceivers": 3,
              "totalUniqueSenders": 3,
            },
            {
              "avgMaxBlobGasFee": 100,
              "day": 2023-08-26T00:00:00.000Z,
              "totalTransactions": 3,
              "totalUniqueReceivers": 3,
              "totalUniqueSenders": 3,
            },
          ]
        `);
      });

      it("should fill stats to date", async () => {
        await prisma.transactionDailyStats.fill({
          to: "2023-08-25",
        });

        const result = await prisma.transactionDailyStats.findMany();
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgMaxBlobGasFee": 110,
              "day": 2023-08-24T00:00:00.000Z,
              "totalTransactions": 3,
              "totalUniqueReceivers": 3,
              "totalUniqueSenders": 3,
            },
          ]
        `);
      });

      it("should fill stats from date", async () => {
        await prisma.transactionDailyStats.fill({
          from: "2023-08-26",
        });

        const result = await prisma.transactionDailyStats.findMany();
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgMaxBlobGasFee": 100,
              "day": 2023-08-26T00:00:00.000Z,
              "totalTransactions": 3,
              "totalUniqueReceivers": 3,
              "totalUniqueSenders": 3,
            },
          ]
        `);
      });

      it("should not fill stats if no data during that date", async () => {
        await prisma.transactionDailyStats.fill({
          from: "2023-08-28",
          to: "2023-08-30",
        });

        const result = await prisma.transactionDailyStats.findMany();
        expect(result).toHaveLength(0);
      });

      it("should update stats for a date with new data", async () => {
        await prisma.transactionDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        await createTransactions();

        await prisma.transactionDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const resultAfter = await prisma.transactionDailyStats.findMany();

        expect(resultAfter).toMatchInlineSnapshot(`
          [
            {
              "avgMaxBlobGasFee": 110,
              "day": 2023-08-24T00:00:00.000Z,
              "totalTransactions": 5,
              "totalUniqueReceivers": 5,
              "totalUniqueSenders": 5,
            },
            {
              "avgMaxBlobGasFee": 100,
              "day": 2023-08-26T00:00:00.000Z,
              "totalTransactions": 3,
              "totalUniqueReceivers": 3,
              "totalUniqueSenders": 3,
            },
          ]
        `);
      });

      it("should delete all stats", async () => {
        await prisma.transactionDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const stats = await prisma.transactionDailyStats.findMany();
        expect(stats).toHaveLength(2);

        await prisma.transactionDailyStats.deleteMany();

        const statsAfter = await prisma.transactionDailyStats.findMany();
        expect(statsAfter).toHaveLength(0);
      });
    });
  });

  describe("Overall Stats", () => {
    describe("Blob model", () => {
      it("should backfill stats", async () => {
        await prisma.blobOverallStats.backfill();

        const result = await prisma.blobOverallStats.findMany({
          select: {
            totalBlobs: true,
            totalUniqueBlobs: true,
            totalBlobSize: true,
            avgBlobSize: true,
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 1250,
              "totalBlobSize": 7500n,
              "totalBlobs": 6,
              "totalUniqueBlobs": 6,
            },
          ]
        `);
      });

      it("should update overall stats", async () => {
        await prisma.blobOverallStats.backfill();
        await createBlobs();
        await prisma.blobOverallStats.backfill();

        const result = await prisma.blobOverallStats.findMany({
          select: {
            totalBlobs: true,
            totalUniqueBlobs: true,
            totalBlobSize: true,
            avgBlobSize: true,
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 1062.5,
              "totalBlobSize": 8500n,
              "totalBlobs": 8,
              "totalUniqueBlobs": 8,
            },
          ]
        `);
      });

      it("should increment stats in block range", async () => {
        await prisma.blobOverallStats.increment({ from: 1000, to: 1001 });

        const result = await prisma.blobOverallStats.findMany({
          select: {
            totalBlobs: true,
            totalUniqueBlobs: true,
            totalBlobSize: true,
            avgBlobSize: true,
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 1100,
              "totalBlobSize": 3300n,
              "totalBlobs": 3,
              "totalUniqueBlobs": 3,
            },
          ]
        `);
      });

      it("should update stats in block range", async () => {
        await prisma.blobOverallStats.increment({ from: 1000, to: 1001 });
        await createBlobs();
        await prisma.blobOverallStats.increment({ from: 1000, to: 1001 });

        const result = await prisma.blobOverallStats.findMany({
          select: {
            totalBlobs: true,
            totalUniqueBlobs: true,
            totalBlobSize: true,
            avgBlobSize: true,
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "avgBlobSize": 1070,
              "totalBlobSize": 7600n,
              "totalBlobs": 8,
              "totalUniqueBlobs": 8,
            },
          ]
        `);
      });
    });

    describe("Block model", () => {
      it("should backfill stats", async () => {
        await prisma.blockOverallStats.backfill();

        const result = await prisma.blockOverallStats.findMany({
          select: {
            totalBlocks: true,
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "totalBlocks": 2,
            },
          ]
        `);
      });

      it("should update overall stats", async () => {
        await prisma.blockOverallStats.backfill();
        await createBlocks();
        await prisma.blockOverallStats.backfill();

        const result = await prisma.blockOverallStats.findMany({
          select: {
            totalBlocks: true,
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "totalBlocks": 4,
            },
          ]
        `);
      });

      it("should increment stats in block range", async () => {
        await prisma.blockOverallStats.increment({ from: 1000, to: 1001 });

        const result = await prisma.blockOverallStats.findMany({
          select: {
            totalBlocks: true,
          },
        });
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "totalBlocks": 1,
            },
          ]
        `);
      });
    });

    describe("Transaction model", () => {
      it("should backfill stats", async () => {
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
              "totalTransactions": 6,
              "totalUniqueReceivers": 4,
              "totalUniqueSenders": 4,
            },
          ]
        `);
      });

      it("should update overall stats", async () => {
        await prisma.transactionOverallStats.backfill();
        await createTransactions();
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
              "totalTransactions": 8,
              "totalUniqueReceivers": 5,
              "totalUniqueSenders": 6,
            },
          ]
        `);
      });

      it("should increment stats in block range", async () => {
        await prisma.transactionOverallStats.increment({
          from: 1000,
          to: 1001,
        });

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
              "totalTransactions": 3,
              "totalUniqueReceivers": 3,
              "totalUniqueSenders": 3,
            },
          ]
        `);
      });

      it("should update stats in block range", async () => {
        await prisma.transactionOverallStats.increment({
          from: 1000,
          to: 1001,
        });
        await createTransactions();
        await prisma.transactionOverallStats.increment({
          from: 1000,
          to: 1001,
        });

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
              "totalTransactions": 8,
              "totalUniqueReceivers": 7,
              "totalUniqueSenders": 6,
            },
          ]
        `);
      });
    });
  });
});
