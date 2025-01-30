import { describe, expect, it, vi } from "vitest";

import { getDateFromISODateTime, toDailyDate } from "@blobscan/dayjs";
import { prisma } from "@blobscan/db";

import { aggregateDailyStats } from "../src";
import { CURRENT_DAY_DATA } from "./DailyStatsSyncer.test.fixtures";
import {
  getDailyStatsDates,
  indexNewBlock,
} from "./DailyStatsSyncer.test.utils";

describe("DailyStatsSyncer", () => {
  it("should aggregate data for all available days", async () => {
    await aggregateDailyStats();

    const dailyStatsDates = await getDailyStatsDates();

    expect(dailyStatsDates).toMatchSnapshot();
  });

  it("should skip aggregation if not all blocks have been indexed for the last day", async () => {
    await indexNewBlock(CURRENT_DAY_DATA);

    await aggregateDailyStats();

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
    const findLatestSpy = vi
      .spyOn(prisma.block, "findLatest")
      .mockImplementationOnce(() => Promise.resolve(null));

    await aggregateDailyStats();

    const dailyStatsDates = await getDailyStatsDates();

    expect(findLatestSpy, "findLatest should be called").toHaveBeenCalled();
    expect(dailyStatsDates, "Daily stats should be empty").toEqual([]);
  });

  it("should skip aggregation if already up to date", async () => {
    await indexNewBlock(CURRENT_DAY_DATA);

    await aggregateDailyStats();

    const dailyStatsSpy = vi.spyOn(prisma.dailyStats, "aggregate");

    await aggregateDailyStats();

    expect(
      dailyStatsSpy,
      "Daily stats should not be populated"
    ).not.toHaveBeenCalled();

    dailyStatsSpy.mockRestore();
  });
});
