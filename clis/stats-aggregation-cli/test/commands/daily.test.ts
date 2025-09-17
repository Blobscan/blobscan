import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { fixtures } from "@blobscan/test";

import { daily, dailyCommandUsage } from "../../src/commands/daily";
import { prisma } from "../../src/prisma";
import {
  getDailyStats,
  getDailyStatsByDateRange,
  runHelpArgTests,
  toDailyFormat,
} from "../helpers";

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
    it("should aggregate all data correctly", async () => {
      await daily();

      const dailyStats = await getDailyStats();

      expect(dailyStats).toMatchSnapshot();
    });

    describe("when providing a date period", () => {
      it("should aggregate data from the provided period", async () => {
        const fromDate = "2023-05-05";
        const toDate = "2023-08-30";

        await daily(["--from", fromDate, "--to", toDate]);

        const statsOutsideRange = await getDailyStatsByDateRange({
          fromDate,
          toDate,
          invertRange: true,
        });

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

        await daily();

        const dailyStats = (await prisma.dailyStats.findMany()).sort(
          (a, b) => a.day.getTime() - b.day.getTime()
        );

        const earliestDailyStat = dailyStats[0];
        const earliestDate = earliestDailyStat
          ? toDailyFormat(earliestDailyStat.day)
          : null;
        const latestDailyStat = dailyStats[dailyStats.length - 1];
        const latestDate = latestDailyStat
          ? toDailyFormat(latestDailyStat.day)
          : null;

        expect(earliestDate, "Earliest date mismatch").toBe(
          expectedEarliestDate
        );
        expect(latestDate, "Latest date mismatch").toBe(expectedLatestDate);
      });

      it("should aggregate data until the current date when no end date is provided", async () => {
        const fromDate = "2023-05-05";

        await daily(["--from", fromDate]);

        const statsOutsideRange = await getDailyStatsByDateRange({
          fromDate,
          invertRange: true,
        });

        expect(statsOutsideRange).toEqual([]);
      });

      it("should aggregate data from the earliest date when no start date is provided", async () => {
        const toDate = "2023-08-05";

        await daily(["--to", toDate]);

        const statsOutsideRange = await getDailyStatsByDateRange({
          toDate,
          invertRange: true,
        });

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

  describe("when providing the delete flag", () => {
    beforeEach(async () => {
      await daily();
    });

    it("should delete all daily stats", async () => {
      await daily(["--delete"]);

      const dailyStats = await getDailyStats();

      expect(dailyStats).toEqual([]);
    });

    describe("when specifying a date period", () => {
      it("should delete data from a given period", async () => {
        const fromDate = "2023-05-05";
        const toDate = "2023-08-30";

        await daily(["--from", fromDate, "--to", toDate, "--delete"]);

        const dailyStats = await getDailyStatsByDateRange({
          fromDate,
          toDate,
        });

        expect(dailyStats).toEqual([]);
      });

      it("should delete all data when no period is provided", async () => {
        await daily(["--delete"]);

        const dailyStats = await prisma.dailyStats.findMany();

        expect(dailyStats, "Block daily stats should be empty").toEqual([]);
      });

      it("should delete data until the latest date when no end date is provided", async () => {
        const fromDate = "2023-05-05";

        await daily(["--from", fromDate, "--delete"]);

        const dailyStats = await getDailyStatsByDateRange({
          fromDate,
        });

        expect(dailyStats).toEqual([]);
      });

      it("should delete data from the earliest date when no start date is provided", async () => {
        const toDate = "2023-08-05";

        await daily(["--to", toDate, "--delete"]);

        const dailyStats = await getDailyStatsByDateRange({
          toDate,
        });

        expect(dailyStats).toEqual([]);
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
