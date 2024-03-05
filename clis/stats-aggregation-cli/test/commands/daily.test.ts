import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { daily, dailyCommandUsage } from "../../src/commands/daily";
import {
  getDailyStatsByDateRange,
  runHelpArgTests,
  toDailyFormat,
} from "../helpers";

function sortByDay(a: { day: string | Date }, b: { day: string | Date }) {
  return new Date(a.day).getTime() - new Date(b.day).getTime();
}

function getAllDailyStats() {
  return Promise.all([
    prisma.blobDailyStats.findMany(),
    prisma.blockDailyStats.findMany(),
    prisma.transactionDailyStats.findMany(),
  ]).then((allDailyStats) =>
    allDailyStats.map((stats) => stats.sort(sortByDay))
  );
}

const DATE_SORTED_BLOCKS = fixtures.blocks.sort((a, b) => {
  return new Date(a.insertedAt).getTime() - new Date(b.insertedAt).getTime();
});

describe("Daily command", () => {
  runHelpArgTests(daily, dailyCommandUsage);

  beforeAll(() => {
    // Silence console.log
    vi.spyOn(console, "log").mockImplementation(() => void {});
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe("when aggregating daily stats", () => {
    it("should aggregate all entities' data when no entity is provided", async () => {
      await daily();

      const [blobDailyStats, blockDailyStats, transactionDailyStats] =
        await getAllDailyStats();

      expect(blobDailyStats, "Blob daily stats mismatch").toMatchSnapshot();
      expect(blockDailyStats, "Block daily stats mismatch").toMatchSnapshot();
      expect(
        transactionDailyStats,
        "Transaction daily stats mismatch"
      ).toMatchSnapshot();
    });

    it("should aggregate blob data when the blob entity is provided", async () => {
      await daily(["--entity", "blob"]);

      const [blobDailyStats, blockDailyStats, transactionDailyStats] =
        await getAllDailyStats();

      expect(blobDailyStats, "Blob daily stats mismatch").toMatchSnapshot();
      expect(blockDailyStats, "Block daily stats should be empty").toEqual([]);
      expect(
        transactionDailyStats,
        "Transaction daily stats should be empty"
      ).toEqual([]);
    });

    describe("when specifying a date period", () => {
      it("should aggregate data from the provided period", async () => {
        const fromDate = "2023-05-05";
        const toDate = "2023-08-30";

        await daily(["--from", fromDate, "--to", toDate, "--entity", "blob"]);

        const statsOutsideRange = getDailyStatsByDateRange(
          await prisma.blobDailyStats.findMany(),
          {
            fromDate,
            toDate,
            invertRange: true,
          }
        );

        expect(statsOutsideRange).toEqual([]);
      });

      it("should aggregate all data when no period is provided", async () => {
        const expectedEarliestDailyStat = DATE_SORTED_BLOCKS[0];
        const expectedEarliestDate = expectedEarliestDailyStat
          ? toDailyFormat(expectedEarliestDailyStat.insertedAt)
          : null;
        const expectedLatestDailyStat =
          DATE_SORTED_BLOCKS[DATE_SORTED_BLOCKS.length - 1];
        const expectedLatestDate = expectedLatestDailyStat
          ? toDailyFormat(expectedLatestDailyStat.insertedAt)
          : null;

        await daily(["--entity", "block"]);

        const blobDailyStats = (await prisma.blockDailyStats.findMany()).sort(
          (a, b) => a.day.getTime() - b.day.getTime()
        );

        const earliestDailyStat = blobDailyStats[0];
        const earliestDate = earliestDailyStat
          ? toDailyFormat(earliestDailyStat.day)
          : null;
        const latestDailyStat = blobDailyStats[blobDailyStats.length - 1];
        const latestDate = latestDailyStat
          ? toDailyFormat(latestDailyStat.day)
          : null;

        expect(earliestDate, "Earliest date mismatch").toBe(
          expectedEarliestDate
        );
        expect(latestDate, "Latest date mismatch").toBe(expectedLatestDate);
      });

      it("should aggregate data until the latest date when no end date is provided", async () => {
        const fromDate = "2023-05-05";

        await daily(["--from", fromDate, "--entity", "block"]);

        const statsOutsideRange = getDailyStatsByDateRange(
          await prisma.blockDailyStats.findMany(),
          {
            fromDate,
            invertRange: true,
          }
        );

        expect(statsOutsideRange).toEqual([]);
      });

      it("should aggregate data from the earliest date when no start date is provided", async () => {
        const toDate = "2023-08-05";

        await daily(["--to", toDate, "--entity", "block"]);

        const statsOutsideRange = getDailyStatsByDateRange(
          await prisma.blockDailyStats.findMany(),
          {
            toDate,
            invertRange: true,
          }
        );

        expect(statsOutsideRange).toEqual([]);
      });

      it("should fail when starting date is after ending date", async () => {
        await expect(
          daily(["--from", "2021-01-02", "--to", "2021-01-01"])
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          '"Daily stats aggregation failed: Invalid date period. Start date is after end date"'
        );
      });
    });
  });

  describe("when deleting daily stats", () => {
    beforeEach(async () => {
      await daily();
    });

    it("should delete all daily stats when no entity is provided", async () => {
      await daily(["--delete"]);

      const [blobDailyStats, blockDailyStats, transactionDailyStats] =
        await getAllDailyStats();

      expect(blobDailyStats, "Blob daily stats should be empty").toEqual([]);
      expect(blockDailyStats, "Block daily stats should be empty").toEqual([]);
      expect(
        transactionDailyStats,
        "Transaction daily stats should be empty"
      ).toEqual([]);
    });

    it("should delete blob daily stats when the blob entity is provided", async () => {
      const [_, beforeBlockDailyStats, beforeTransactionDailyStats] =
        await getAllDailyStats();

      await daily(["--delete", "--entity", "blob"]);

      const [blobDailyStats, blockDailyStats, transactionDailyStats] =
        await getAllDailyStats();

      expect(blobDailyStats, "Blob daily stats should be empty").toEqual([]);
      expect(blockDailyStats, "Block daily stats mismatch").toEqual(
        beforeBlockDailyStats
      );
      expect(transactionDailyStats, "Transaction daily stats mismatch").toEqual(
        beforeTransactionDailyStats
      );
    });

    describe("when specifying a date period", () => {
      it("should delete data from a given period", async () => {
        const fromDate = "2023-05-05";
        const toDate = "2023-08-30";

        await daily([
          "--from",
          fromDate,
          "--to",
          toDate,
          "--delete",
          "--entity",
          "blob",
        ]);

        const blobDailyStats = getDailyStatsByDateRange(
          await prisma.blobDailyStats.findMany(),
          {
            fromDate,
            toDate,
          }
        );

        expect(blobDailyStats).toEqual([]);
      });

      it("should delete all data when no period is provided", async () => {
        await daily(["--delete", "--entity", "block"]);

        const blobDailyStats = await prisma.blockDailyStats.findMany();

        expect(blobDailyStats, "Block daily stats should be empty").toEqual([]);
      });

      it("should delete data until the latest date when no end date is provided", async () => {
        const fromDate = "2023-05-05";

        await daily(["--from", fromDate, "--entity", "block", "--delete"]);

        const blockDailyStats = getDailyStatsByDateRange(
          await prisma.blockDailyStats.findMany(),
          {
            fromDate,
          }
        );

        expect(blockDailyStats).toEqual([]);
      });

      it("should delete data from the earliest date when no start date is provided", async () => {
        const toDate = "2023-08-05";

        await daily(["--to", toDate, "--entity", "block", "--delete"]);

        const blockDailyStats = getDailyStatsByDateRange(
          await prisma.blockDailyStats.findMany(),
          {
            toDate,
          }
        );

        expect(blockDailyStats).toEqual([]);
      });

      it("should fail when starting date is after ending date", async () => {
        await expect(
          daily(["--from", "2021-01-02", "--to", "2021-01-01", "--delete"])
        ).rejects.toThrowErrorMatchingInlineSnapshot(
          '"Daily stats deletion failed: Invalid date period. Start date is after end date"'
        );
      });
    });
  });
});
