import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDateFromISODateTime, toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { DailyStatsSyncer } from "../src/syncers/";
import { CURRENT_DAY_DATA } from "./DailyStatsSyncer.test.fixtures";
import {
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

    const { blobDailyStats, blockDailyStats, txDailyStats } =
      await getAllDailyStatsDates();

    expect(blobDailyStats, "Blob daily stats mismatch").toMatchSnapshot();
    expect(blockDailyStats, "Block daily stats mismatch").toMatchSnapshot();
    expect(txDailyStats, "Transaction daily stats mismatch").toMatchSnapshot();
  });

  it("should skip aggregation if not all blocks have been indexed for the last day", async () => {
    const workerProcessor = dailyStatsSyncer.getWorkerProcessor();

    await indexNewBlock(CURRENT_DAY_DATA);

    await workerProcessor();

    const { blobDailyStats, blockDailyStats, txDailyStats } =
      await getAllDailyStatsDates();

    const currentDay = getDateFromISODateTime(
      toDailyDate(CURRENT_DAY_DATA.block.timestamp)
    );

    expect(
      blobDailyStats.find(([day]) => day === currentDay),
      "Blob daily stats should not include the current day"
    ).toBeUndefined();
    expect(
      blockDailyStats.find((day) => day === currentDay),
      "Block daily stats should not include the current day"
    ).toBeUndefined();
    expect(
      txDailyStats.find(([day]) => day === currentDay),
      "Transaction daily stats should not include the current day"
    ).toBeUndefined();
  });

  it("should skip aggregation if no blocks have been indexed yet", async () => {
    const workerProcessor = dailyStatsSyncer.getWorkerProcessor();

    const findLatestSpy = vi
      .spyOn(prisma.block, "findLatest")
      .mockImplementationOnce(() => Promise.resolve(null));

    await workerProcessor();

    const { blobDailyStats, blockDailyStats, txDailyStats } =
      await getAllDailyStatsDates();

    expect(findLatestSpy, "findLatest should be called").toHaveBeenCalled();
    expect(blobDailyStats, "Blob daily stats should be empty").toEqual([]);
    expect(blockDailyStats, "Block daily stats should be empty").toEqual([]);
    expect(txDailyStats, "Transaction daily stats should be empty").toEqual([]);
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
