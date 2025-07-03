import { beforeEach, describe, expect, it, vi } from "vitest";

import { getDateFromISODateTime, toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { DailyStatsCronJob } from "../src/stats/DailyStatsCronJob";
import { CURRENT_DAY_DATA } from "./DailyStatsCronJob.test.fixtures";
import {
  getDailyStatsDates,
  indexNewBlock,
} from "./DailyStatsCronJob.test.utils";

class DailyStatsCronJobMock extends DailyStatsCronJob {
  constructor(redisUri = process.env.REDIS_URI ?? "") {
    super({ redisUriOrConnection: redisUri, cronPattern: "* * * * *" });
  }

  getWorker() {
    return this.worker;
  }

  getWorkerProcessor() {
    return this.jobFn;
  }

  getQueue() {
    return this.queue;
  }
}

describe("DailyStatsCronJob", () => {
  let dailyStatsCronJob: DailyStatsCronJobMock;

  beforeEach(() => {
    dailyStatsCronJob = new DailyStatsCronJobMock();

    return async () => {
      await dailyStatsCronJob.close();
    };
  });

  it("should aggregate data for all available days", async () => {
    const workerProcessor = dailyStatsCronJob.getWorkerProcessor();

    await workerProcessor();

    const dailyStatsDates = await getDailyStatsDates();

    expect(dailyStatsDates).toMatchSnapshot();
  });

  it("should skip aggregation if not all blocks have been indexed for the last day", async () => {
    const workerProcessor = dailyStatsCronJob.getWorkerProcessor();

    await indexNewBlock(CURRENT_DAY_DATA);

    await workerProcessor();

    const dailyStatsDates = await getDailyStatsDates();

    const currentDay = getDateFromISODateTime(
      toDailyDate(CURRENT_DAY_DATA.block.timestamp)
    );

    expect(
      dailyStatsDates.find(([day]) => day === currentDay),
      "Daily stats should not include the current day"
    ).toBeUndefined();
  });

  it("should skip aggregation if no blocks have been indexed yet", async () => {
    const workerProcessor = dailyStatsCronJob.getWorkerProcessor();

    const findLatestSpy = vi
      .spyOn(prisma.block, "findLatest")
      .mockImplementationOnce(() => Promise.resolve(null));

    await workerProcessor();

    const dailyStatsDates = await getDailyStatsDates();

    expect(findLatestSpy, "findLatest should be called").toHaveBeenCalled();
    expect(dailyStatsDates, "Daily stats should be empty").toEqual([]);
  });

  it("should skip aggregation if already up to date", async () => {
    await indexNewBlock(CURRENT_DAY_DATA);

    const workerProcessor = dailyStatsCronJob.getWorkerProcessor();

    await workerProcessor();

    const dailyStatsSpy = vi.spyOn(prisma.dailyStats, "aggregate");

    await workerProcessor();

    expect(
      dailyStatsSpy,
      "Daily stats should not be populated"
    ).not.toHaveBeenCalled();

    dailyStatsSpy.mockRestore();
  });
});
