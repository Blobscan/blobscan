import { describe, it, expect } from "vitest";

import { prisma } from "../../prisma";

describe("Stats Extension", () => {
  describe("Daily Stats", () => {
    describe("Blob model", () => {
      it("should fill stats in a date period", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-24",
          to: "2023-08-27",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toMatchSnapshot();
      });

      it("should fill stats to date", async () => {
        await prisma.blobDailyStats.fill({
          to: "2023-08-25",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toMatchSnapshot();
      });

      it("should fill stats from date", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-26",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toMatchSnapshot();
      });

      it("should not fill stats if no data during that date", async () => {
        await prisma.blobDailyStats.fill({
          from: "2023-08-28",
          to: "2023-08-30",
        });

        const result = await prisma.blobDailyStats.findMany();
        expect(result).toHaveLength(0);
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
        expect(result).toMatchSnapshot();
      });

      it("should fill stats to date", async () => {
        await prisma.blockDailyStats.fill({
          to: "2023-08-25",
        });

        const result = await prisma.blockDailyStats.findMany();
        expect(result).toMatchSnapshot();
      });

      it("should fill stats from date", async () => {
        await prisma.blockDailyStats.fill({
          from: "2023-08-26",
        });

        const result = await prisma.blockDailyStats.findMany();
        expect(result).toMatchSnapshot();
      });

      it("should not fill stats if no data during that date", async () => {
        await prisma.blockDailyStats.fill({
          from: "2023-08-28",
          to: "2023-08-30",
        });

        const result = await prisma.blockDailyStats.findMany();
        expect(result).toHaveLength(0);
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
        expect(result).toMatchSnapshot();
      });

      it("should fill stats to date", async () => {
        await prisma.transactionDailyStats.fill({
          to: "2023-08-25",
        });

        const result = await prisma.transactionDailyStats.findMany();
        expect(result).toMatchSnapshot();
      });

      it("should fill stats from date", async () => {
        await prisma.transactionDailyStats.fill({
          from: "2023-08-26",
        });

        const result = await prisma.transactionDailyStats.findMany();
        expect(result).toMatchSnapshot();
      });

      it("should not fill stats if no data during that date", async () => {
        await prisma.transactionDailyStats.fill({
          from: "2023-08-28",
          to: "2023-08-30",
        });

        const result = await prisma.transactionDailyStats.findMany();
        expect(result).toHaveLength(0);
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
        expect(result).toMatchSnapshot();
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
        expect(result).toMatchSnapshot();
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
        expect(result).toMatchSnapshot();
      });

      it("should increment stats in block range", async () => {
        await prisma.blockOverallStats.increment({ from: 1000, to: 1001 });

        const result = await prisma.blockOverallStats.findMany({
          select: {
            totalBlocks: true,
          },
        });
        expect(result).toMatchSnapshot();
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
        expect(result).toMatchSnapshot();
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
        expect(result).toMatchSnapshot();
      });
    });
  });
});
