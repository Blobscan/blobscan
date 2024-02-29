import { beforeEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { DailyStatsUpdater } from "../src/updaters/DailyStatsUpdater";
import { formatDate } from "../src/utils";

async function getAllDailyStatsDays() {
  const allDailyStats = await Promise.all([
    prisma.blobDailyStats.findMany(),
    prisma.blockDailyStats.findMany(),
    prisma.transactionDailyStats.findMany(),
  ]);

  return allDailyStats.map((dailyStats) =>
    dailyStats.map((stats) => formatDate(stats.day))
  );
}

function expectNotCurrentDay(
  dailyStatsDays: string[] | undefined,
  entity: "blob" | "block" | "transaction"
) {
  expect(
    dailyStatsDays?.filter((day) => dayjs(day).isAfter(formatDate(dayjs()))),
    `${entity} daily stats should not contain current day`
  ).toEqual([]);
}

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

  it("should aggregate data up until yesterday", async () => {
    const workerProcessor = dailyStatsUpdater.getWorkerProcessor();

    await workerProcessor();

    const [blobDailyStatsDays, blockDailyStatsDays, transactionDailyStatsDays] =
      await getAllDailyStatsDays();

    expectNotCurrentDay(blobDailyStatsDays, "blob");
    expectNotCurrentDay(blockDailyStatsDays, "block");
    expectNotCurrentDay(transactionDailyStatsDays, "transaction");
  });

  it("should skip aggregation if already up to date", async () => {
    const workerProcessor = dailyStatsUpdater.getWorkerProcessor();

    await workerProcessor();

    const blobPopulateSpy = vi.spyOn(prisma.blobDailyStats, "populate");
    const blockPopulateSpy = vi.spyOn(prisma.blockDailyStats, "populate");
    const transactionPopulateSpy = vi.spyOn(
      prisma.transactionDailyStats,
      "populate"
    );

    await workerProcessor();

    expect(
      blobPopulateSpy,
      "Blob daily stats should not be populated"
    ).not.toHaveBeenCalled();
    expect(
      blockPopulateSpy,
      "Block daily stats should not be populated"
    ).not.toHaveBeenCalled();
    expect(
      transactionPopulateSpy,
      "Transaction daily stats should not be populated"
    ).not.toHaveBeenCalled();
  });
});
