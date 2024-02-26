import { beforeEach, describe, expect, it, vi } from "vitest";

import { StatsSyncer } from "../src/StatsSyncer";
import { env } from "../src/env";

class StatsSyncerMock extends StatsSyncer {
  constructor(redisUri: string = env.REDIS_URI) {
    super(redisUri);
  }

  getDailyStatsUpdater() {
    return this.dailyStatsUpdater;
  }

  getOverallStatsUpdater() {
    return this.overallStatsUpdater;
  }
}

describe("StatsSyncer", () => {
  let statsSyncer: StatsSyncerMock;

  beforeEach(() => {
    statsSyncer = new StatsSyncerMock();

    return async () => {
      await statsSyncer.close();
    };
  });

  describe("when running the stats syncer", () => {
    it("should run updaters correctly", async () => {
      const dailyStatsUpdaterRunSpy = vi.spyOn(
        statsSyncer.getDailyStatsUpdater(),
        "run"
      );
      const overallStatsUpdaterRunSpy = vi.spyOn(
        statsSyncer.getOverallStatsUpdater(),
        "run"
      );

      await statsSyncer.run({
        cronPatterns: { daily: "* * * * *", overall: "* * * * *" },
      });

      expect(dailyStatsUpdaterRunSpy).toHaveBeenCalledWith("* * * * *");
      expect(overallStatsUpdaterRunSpy).toHaveBeenCalledWith("* * * * *");
    });

    it("should throw a valid error when failing to run a stats syncer", async () => {
      const cronPatterns = {
        daily: "* * * * *",
        overall: "* * * * *",
      };

      vi.spyOn(statsSyncer.getDailyStatsUpdater(), "run").mockRejectedValueOnce(
        new Error("Daily stats updater error")
      );

      await expect(
        statsSyncer.run({ cronPatterns })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        '"Failed to run stats syncer: Error: Daily stats updater error"'
      );
    });
  });

  describe("when closing the stats syncer", () => {
    it("should close the updaters", async () => {
      const closeStatsSyncer = new StatsSyncerMock();
      const dailyStatsUpdater = closeStatsSyncer.getDailyStatsUpdater();
      const overallStatsUpdater = closeStatsSyncer.getOverallStatsUpdater();

      const dailyStatsUpdaterCloseSpy = vi.spyOn(dailyStatsUpdater, "close");
      const overallStatsUpdaterCloseSpy = vi.spyOn(
        overallStatsUpdater,
        "close"
      );

      await closeStatsSyncer.close();

      expect(dailyStatsUpdaterCloseSpy).toHaveBeenCalledOnce();
      expect(overallStatsUpdaterCloseSpy).toHaveBeenCalledOnce();
    });

    it("should throw a valid error when failing to close the stats syncer", async () => {
      const dailyStatsUpdater = statsSyncer.getDailyStatsUpdater();
      vi.spyOn(dailyStatsUpdater, "close").mockRejectedValueOnce(
        new Error("Some daily stats updater closing error")
      );

      await expect(
        statsSyncer.close()
      ).rejects.toThrowErrorMatchingInlineSnapshot('"Failed to close stats syncer: Error: Some daily stats updater closing error"');
    });
  });
});
