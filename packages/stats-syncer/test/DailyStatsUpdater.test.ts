import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@blobscan/db";

import { DailyStatsUpdater } from "../src/updaters/DailyStatsUpdater";

class DailyStatsUpdaterMock extends DailyStatsUpdater {
  constructor(redisUri = process.env.REDIS_URI ?? "") {
    super(redisUri);
  }

  getWorker() {
    return this.worker;
  }

  getWorkerProcessor() {
    return this.updaterFn;
  }

  getQueue() {
    return this.queue;
  }
}

describe("DailyStatsUpdater", () => {
  let dailyStatsUpdater: DailyStatsUpdaterMock;

  beforeEach(() => {
    dailyStatsUpdater = new DailyStatsUpdaterMock();

    return async () => {
      await dailyStatsUpdater.close();
    };
  });

  it("should aggregate yesterday's stats correctly", async () => {
    const workerProcessor = dailyStatsUpdater.getWorkerProcessor();

    await workerProcessor();

    const dailyStats = await Promise.all([
      prisma.blobDailyStats.findMany(),
      prisma.blockDailyStats.findMany(),
      prisma.transactionDailyStats.findMany(),
    ]);

    expect(dailyStats).toMatchSnapshot();
  });
});
