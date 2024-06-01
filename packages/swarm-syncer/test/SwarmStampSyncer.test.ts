import { beforeEach, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

import { StatsSyncer } from "../src/StatsSyncer";
import { StatsSyncerError } from "../src/errors";

class StatsSyncerMock extends StatsSyncer {
  constructor(redisUri = "redis://localhost:6379/1") {
    super({ redisUri });
  }

  getConnection() {
    return this.connection;
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
    it("should start updaters correctly", async () => {
      const dailyStatsUpdaterStartSpy = vi.spyOn(
        statsSyncer.getDailyStatsUpdater(),
        "start"
      );
      const overallStatsUpdaterStartSpy = vi.spyOn(
        statsSyncer.getOverallStatsUpdater(),
        "start"
      );

      await statsSyncer.start({
        cronPatterns: { daily: "* * * * *", overall: "* * * * *" },
      });

      expect(dailyStatsUpdaterStartSpy).toHaveBeenCalledWith("* * * * *");
      expect(overallStatsUpdaterStartSpy).toHaveBeenCalledWith("* * * * *");
    });

    testValidError(
      "should throw a valid error when failing to start it",
      async () => {
        const cronPatterns = {
          daily: "* * * * *",
          overall: "* * * * *",
        };

        vi.spyOn(
          statsSyncer.getDailyStatsUpdater(),
          "start"
        ).mockRejectedValueOnce(
          new Error(
            "Something happened when trying to start daily stats updater"
          )
        );

        await statsSyncer.start({
          cronPatterns,
        });
      },
      StatsSyncerError,
      {
        checkCause: true,
      }
    );
  });

  describe("when closing the stats syncer", () => {
    it("should close the updaters", async () => {
      const closeStatsSyncer = new StatsSyncerMock();
      const dailyStatsUpdater = closeStatsSyncer.getDailyStatsUpdater();
      const overallStatsUpdater = closeStatsSyncer.getOverallStatsUpdater();
      const connection = closeStatsSyncer.getConnection();

      const dailyStatsUpdaterCloseSpy = vi.spyOn(dailyStatsUpdater, "close");
      const overallStatsUpdaterCloseSpy = vi.spyOn(
        overallStatsUpdater,
        "close"
      );
      const connectionCloseSpy = vi.spyOn(connection, "disconnect");

      await closeStatsSyncer.close();

      expect(dailyStatsUpdaterCloseSpy).toHaveBeenCalledOnce();
      expect(overallStatsUpdaterCloseSpy).toHaveBeenCalledOnce();
      expect(connectionCloseSpy).toHaveBeenCalledOnce();
    });

    testValidError(
      "should throw a valid error when failing to close it",
      async () => {
        const closeStatsSyncer = new StatsSyncerMock();
        const dailyStatsUpdater = closeStatsSyncer.getDailyStatsUpdater();
        vi.spyOn(dailyStatsUpdater, "close").mockRejectedValueOnce(
          new Error("Some daily stats updater closing error")
        );

        await closeStatsSyncer.close();
      },
      StatsSyncerError,
      { checkCause: true }
    );
  });
});
