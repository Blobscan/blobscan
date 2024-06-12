import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { DailyStatsSyncer } from "../src/syncers/";
import { formatDate } from "../src/utils";
import { CURRENT_DAY_DATA } from "./DailyStatsSyncer.test.fixtures";
import {
  expectDailyStatsDatesToBeEqual,
  getAllDailyStatsDates,
  indexNewBlock,
} from "./DailyStatsSyncer.test.utils";

class DailyStatsSyncerMock extends DailyStatsSyncer {
  constructor(redisUri = process.env.REDIS_URI ?? "") {
    super({ redisUriOrConnection: redisUri, cronPattern: "* * * * *" });
  }

  getWorker() {
    return this.worker;
  }

  getWorkerProcessor() {
    return this.syncerFn;
  }

  getQueue() {
    return this.queue;
  }
}

describe("DailyStatsSyncer", () => {
  const allExpectedDates = Array.from(
    new Set(fixtures.blocks.map((block) => formatDate(block.timestamp)))
  ).sort((a, b) => (a < b ? -1 : 1));

  let dailyStatsSyncer: DailyStatsSyncerMock;

  beforeEach(() => {
    dailyStatsSyncer = new DailyStatsSyncerMock();

    return async () => {
      await dailyStatsSyncer.close();
    };
  });

  it("should aggregate data for all available days", async () => {
    const workerProcessor = dailyStatsSyncer.getWorkerProcessor();

    await workerProcessor();

    const allDailyStatsDates = await getAllDailyStatsDates();

    const expectedAllDatesButLastOne = allExpectedDates.slice(0, -1);

    expectDailyStatsDatesToBeEqual(
      allDailyStatsDates,
      expectedAllDatesButLastOne
    );
  });

  it("should skip aggregation if not all blocks have been indexed for the last day", async () => {
    const workerProcessor = dailyStatsSyncer.getWorkerProcessor();

    await indexNewBlock(CURRENT_DAY_DATA);

    await workerProcessor();

    const allDailyStatsDates = await getAllDailyStatsDates();

    const expectedDates = [...allExpectedDates];

    expectDailyStatsDatesToBeEqual(allDailyStatsDates, expectedDates);
  });

  it("should skip aggregation if no blocks have been indexed yet", async () => {
    const workerProcessor = dailyStatsSyncer.getWorkerProcessor();

    const findLatestSpy = vi
      .spyOn(prisma.block, "findLatest")
      .mockImplementationOnce(() => Promise.resolve(null));

    await workerProcessor();

    const allDailyStatsDates = await getAllDailyStatsDates();

    expect(findLatestSpy, "findLatest should be called").toHaveBeenCalled();
    expectDailyStatsDatesToBeEqual(allDailyStatsDates, []);
  });

  it("should skip aggregation if already up to date", async () => {
    await indexNewBlock(CURRENT_DAY_DATA);

    const workerProcessor = dailyStatsSyncer.getWorkerProcessor();

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

    blobPopulateSpy.mockRestore();
    blockPopulateSpy.mockRestore();
    transactionPopulateSpy.mockRestore();
  });
});
