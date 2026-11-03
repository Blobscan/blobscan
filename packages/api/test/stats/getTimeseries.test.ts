import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures, redis } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import {
  getPeriodStart,
  getTimeFrameGranularity,
} from "../../src/middlewares/withStatFilters";
import { outputSchema } from "../../src/routers/stats/getTimeseries";
import { superjson } from "../../src/superjson";
import { createTestContext } from "../helpers";
import { aggregateMetrics } from "../metrics";
import { runTRPCQueryCacheTests } from "../test-suites/cache";
import type { StatsCaller } from "./caller";
import { createStatsCaller } from "./caller";
import { runTimeFrameTests } from "./helpers";

describe("getTimeseriesStats", () => {
  let caller: StatsCaller;
  let ctx: TRPCContext;
  // A time frame with daily periods
  const input: Parameters<typeof caller.getTimeseries>[0] = {
    timeFrame: "30d",
    sort: "desc",
  };
  const to = dayjs(fixtures.systemDate).endOf("day").toISOString();

  beforeAll(async () => {
    ctx = await createTestContext({ withRedis: true });

    caller = createStatsCaller(ctx);
  });

  beforeEach(async () => {
    await aggregateMetrics(ctx.prisma);

    return async () => {
      await ctx.prisma.dailyMetrics.deleteMany();
    };
  });

  runTimeFrameTests({
    statsFiller() {
      return aggregateMetrics(ctx.prisma, { to });
    },
    statsFetcher(timeFrame) {
      return caller.getTimeseries({ timeFrame });
    },
  });

  runTRPCQueryCacheTests({
    procedureCall() {
      return caller.getTimeseries(input);
    },
    procedureInput: input,
    procedureName: "getTimeseries",
    outputSchema: outputSchema,
    ttlProvided: "daily",
  });

  // In the fixtures, all the blocks of a day have the same blob gas price.
  // Thus the max. and the min. are equal, and the snapshots cannot show a mix-up.
  it("should return the max. and the min. blob gas price in their own fields", async () => {
    const uncachedCaller = createStatsCaller(await createTestContext());

    await ctx.prisma.dailyMetrics.updateMany({
      where: { category: null, rollup: null },
      data: { maxBlobGasPrice: 30, minBlobGasPrice: 10 },
    });

    const result = await uncachedCaller.getTimeseries(input);
    const globalSeries = result.data.series.find(
      (s) => s.dimension.type === "global"
    );
    const { maxBlobGasPrice = [], minBlobGasPrice = [] } =
      globalSeries?.metrics ?? {};

    expect(maxBlobGasPrice.length).toBeGreaterThan(0);
    expect(new Set(maxBlobGasPrice)).toEqual(new Set([BigInt(30)]));
    expect(new Set(minBlobGasPrice)).toEqual(new Set([BigInt(10)]));
  });

  describe("when getting the periods of a time frame", () => {
    it.each([
      ["1d", "hour", "hour"],
      ["7d", "hour", "hour"],
      ["15d", "day", "day"],
      ["30d", "day", "day"],
      ["90d", "day", "day"],
      ["180d", "day", "week"],
      ["365d", "day", "week"],
      ["All", "day", "week"],
      [undefined, "day", "week"],
    ] as const)(
      "should give %s with periods of one %s, or one %s for categories and rollups",
      async (timeFrame, globalGranularity, segmentedGranularity) => {
        const globalResult = await caller.getTimeseries({ timeFrame });
        const categoriesResult = await caller.getTimeseries({
          timeFrame,
          categories: "all",
        });
        const rollupsResult = await caller.getTimeseries({
          timeFrame,
          rollups: "all",
        });

        expect(globalResult.data.granularity).toBe(globalGranularity);
        expect(categoriesResult.data.granularity).toBe(segmentedGranularity);
        expect(rollupsResult.data.granularity).toBe(segmentedGranularity);
      }
    );

    it.each([
      ["1d", 24, "hour"],
      ["7d", 168, "hour"],
      ["30d", 30, "day"],
    ] as const)(
      "should give only the closed periods of %s",
      async (timeFrame, maxPeriods, granularity) => {
        const currentPeriodStart = getPeriodStart(dayjs(), granularity);
        const { timestamps } = (await caller.getTimeseries({ timeFrame })).data;

        expect(timestamps.length).toBeGreaterThan(0);
        expect(timestamps.length).toBeLessThanOrEqual(maxPeriods);

        for (const timestamp of timestamps) {
          expect(timestamp.getTime()).toBeGreaterThanOrEqual(
            currentPeriodStart.subtract(maxPeriods, granularity).valueOf()
          );
          expect(timestamp.getTime()).toBeLessThan(
            currentPeriodStart.valueOf()
          );
        }
      }
    );

    it.each([
      ["1d", "hour"],
      ["30d", "day"],
    ] as const)(
      "should give the start of each period as timestamps for %s",
      async (timeFrame, granularity) => {
        const result = await caller.getTimeseries({ timeFrame });

        expect(result.data.timestamps.length).toBeGreaterThan(0);

        for (const timestamp of result.data.timestamps) {
          expect(getPeriodStart(timestamp, granularity).toDate()).toEqual(
            timestamp
          );
        }
      }
    );

    it("should give all the periods of a long time frame with many series", async () => {
      const currentPeriodStart = getPeriodStart(dayjs(), "week");
      const result = await caller.getTimeseries({
        timeFrame: "365d",
        categories: "all",
        rollups: "all",
        sort: "asc",
      });
      const weeklyRows = await ctx.prisma.weeklyMetrics.findMany({
        select: { periodStart: true },
        distinct: ["periodStart"],
        where: {
          periodStart: {
            gte: currentPeriodStart.subtract(365, "day").toDate(),
            lt: currentPeriodStart.toDate(),
          },
          OR: [{ category: { not: null } }, { rollup: { not: null } }],
        },
        orderBy: { periodStart: "asc" },
      });

      expect(weeklyRows.length).toBeGreaterThan(1);
      expect(result.data.granularity).toBe("week");
      expect(result.data.timestamps).toEqual(
        weeklyRows.map(({ periodStart }) => periodStart)
      );
    });

    it("should start a week on Monday", () => {
      // 2024-03-13 is a Wednesday and 2024-03-17 is a Sunday
      for (const date of [
        "2024-03-11T00:00:00Z",
        "2024-03-13T15:30:00Z",
        "2024-03-17T23:59:59Z",
      ]) {
        expect(getPeriodStart(date, "week").toISOString()).toBe(
          "2024-03-11T00:00:00.000Z"
        );
      }
    });

    it("should use the granularity of All when no time frame is given", () => {
      expect(getTimeFrameGranularity(undefined, { isSegmented: false })).toBe(
        "day"
      );
      expect(getTimeFrameGranularity(undefined, { isSegmented: true })).toBe(
        "week"
      );
    });
  });

  describe.each([
    {
      granularity: "hour",
      timeFrame: "1d",
      table: "hourlyMetrics",
      category: undefined,
    },
    {
      granularity: "week",
      timeFrame: "All",
      table: "weeklyMetrics",
      category: "other",
    },
  ] as const)(
    "when including the current period of a $granularity",
    ({ granularity, timeFrame, table, category }) => {
      it("should add the current period from its metrics table", async () => {
        const uncachedCaller = createStatsCaller(await createTestContext());
        const currentPeriodStart = getPeriodStart(dayjs(), granularity);
        const updatedAt = currentPeriodStart.add(10, "minute").toDate();

        // The metrics tables have the same columns. The fixtures can have
        // data in the current period, so its rows are replaced.
        const metricsTable = ctx.prisma[
          table
        ] as unknown as typeof ctx.prisma.dailyMetrics;

        await metricsTable.deleteMany({
          where: { periodStart: currentPeriodStart.toDate() },
        });
        await metricsTable.create({
          data: {
            periodStart: currentPeriodStart.toDate(),
            category: category ? "OTHER" : undefined,
            totalBlobs: 7,
            updatedAt,
          },
        });

        const result = await uncachedCaller.getTimeseries({
          timeFrame,
          categories: category,
          sort: "asc",
          includeCurrentPeriod: "true",
        });

        expect(result.data.currentPeriod).toEqual({
          timestamp: currentPeriodStart.toDate(),
          updatedAt,
        });
        expect(result.data.timestamps.at(-1)).toEqual(
          currentPeriodStart.toDate()
        );
        expect(result.data.series[0]?.metrics.totalBlobs?.at(-1)).toBe(7);
      });
    }
  );

  describe("when including the current period", () => {
    // The system date of the fixtures is the start of the current period
    const currentPeriodStart = dayjs.utc(fixtures.systemDate).startOf("day");
    let uncachedCaller: StatsCaller;

    async function insertCurrentPeriodRow(
      data: Omit<
        Parameters<typeof ctx.prisma.dailyMetrics.create>[0]["data"],
        "periodStart"
      >
    ) {
      await ctx.prisma.dailyMetrics.create({
        data: { periodStart: currentPeriodStart.toDate(), ...data },
      });
    }

    beforeAll(async () => {
      uncachedCaller = createStatsCaller(await createTestContext());
    });

    it("should not add the current period when it has no data", async () => {
      const withoutCurrentPeriod = await uncachedCaller.getTimeseries(input);
      const withCurrentPeriod = await uncachedCaller.getTimeseries({
        ...input,
        includeCurrentPeriod: "true",
      });

      expect(withCurrentPeriod.data.currentPeriod).toBeUndefined();
      expect(withCurrentPeriod).toEqual(withoutCurrentPeriod);
    });

    it("should not add the current period when it is not requested", async () => {
      await insertCurrentPeriodRow({ totalBlobs: 7 });

      const result = await uncachedCaller.getTimeseries(input);

      expect(result.data.currentPeriod).toBeUndefined();
      expect(result.data.timestamps).not.toContainEqual(
        currentPeriodStart.toDate()
      );
    });

    it("should not add the current period when it is set to false", async () => {
      await insertCurrentPeriodRow({ totalBlobs: 7 });

      const result = await uncachedCaller.getTimeseries({
        ...input,
        includeCurrentPeriod: "false",
      });

      expect(result.data.currentPeriod).toBeUndefined();
    });

    it("should add the current period as the last timestamp for an ascending sort", async () => {
      const updatedAt = currentPeriodStart.add(10, "minute").toDate();

      await insertCurrentPeriodRow({ totalBlobs: 7, updatedAt });

      const closed = await uncachedCaller.getTimeseries({
        ...input,
        sort: "asc",
      });
      const result = await uncachedCaller.getTimeseries({
        ...input,
        sort: "asc",
        includeCurrentPeriod: "true",
      });

      expect(result.data.currentPeriod).toEqual({
        timestamp: currentPeriodStart.toDate(),
        updatedAt,
      });
      expect(result.data.timestamps).toEqual([
        ...closed.data.timestamps,
        currentPeriodStart.toDate(),
      ]);
      expect(result.data.series[0]?.metrics.totalBlobs).toEqual([
        ...(closed.data.series[0]?.metrics.totalBlobs ?? []),
        7,
      ]);
    });

    it("should add the current period as the first timestamp for a descending sort", async () => {
      await insertCurrentPeriodRow({ totalBlobs: 7 });

      const closed = await uncachedCaller.getTimeseries({
        ...input,
        sort: "desc",
      });
      const result = await uncachedCaller.getTimeseries({
        ...input,
        sort: "desc",
        includeCurrentPeriod: "true",
      });

      expect(result.data.timestamps).toEqual([
        currentPeriodStart.toDate(),
        ...closed.data.timestamps,
      ]);
      expect(result.data.series[0]?.startTimestampIdx).toBe(0);
      expect(result.data.series[0]?.metrics.totalBlobs).toEqual([
        7,
        ...(closed.data.series[0]?.metrics.totalBlobs ?? []),
      ]);
    });

    it("should give the latest update time of the current period rows", async () => {
      const latestUpdatedAt = currentPeriodStart.add(20, "minute").toDate();

      await insertCurrentPeriodRow({
        rollup: "BASE",
        totalBlobs: 7,
        updatedAt: currentPeriodStart.add(10, "minute").toDate(),
      });
      await insertCurrentPeriodRow({
        rollup: "OPTIMISM",
        totalBlobs: 3,
        updatedAt: latestUpdatedAt,
      });

      const result = await uncachedCaller.getTimeseries({
        ...input,
        rollups: "all",
        includeCurrentPeriod: "true",
      });

      expect(result.data.currentPeriod?.updatedAt).toEqual(latestUpdatedAt);
    });

    it("should not add the update time to the metrics", async () => {
      await insertCurrentPeriodRow({ totalBlobs: 7 });

      const result = await uncachedCaller.getTimeseries({
        ...input,
        metrics: "totalBlobs",
        includeCurrentPeriod: "true",
      });

      expect(result.data.currentPeriod?.updatedAt).toBeInstanceOf(Date);
      expect(Object.keys(result.data.series[0]?.metrics ?? {})).toEqual([
        "totalBlobs",
      ]);
    });

    it.each(["asc", "desc"] as const)(
      "should fill the series with no data in the current period with zeros (%s)",
      async (sort) => {
        const closed = await uncachedCaller.getTimeseries({
          ...input,
          sort,
          rollups: "all",
        });
        const rollupWithData = closed.data.series.find(
          (s) => s.startTimestampIdx !== undefined
        );

        if (rollupWithData?.dimension.type !== "rollup") {
          throw new Error("The fixtures must have rollup metrics");
        }

        await insertCurrentPeriodRow({
          rollup: rollupWithData.dimension.name.toUpperCase() as "BASE",
          totalBlobs: 7,
        });

        const result = await uncachedCaller.getTimeseries({
          ...input,
          sort,
          rollups: "all",
          includeCurrentPeriod: "true",
        });
        const currentIdx =
          sort === "asc" ? result.data.timestamps.length - 1 : 0;

        for (const series of result.data.series) {
          const closedSeries = closed.data.series.find(
            (s) =>
              JSON.stringify(s.dimension) === JSON.stringify(series.dimension)
          );

          if (closedSeries?.startTimestampIdx === undefined) {
            expect(series.startTimestampIdx).toBeUndefined();
            continue;
          }

          const totalBlobs = series.metrics.totalBlobs ?? [];
          const startIdx = series.startTimestampIdx ?? 0;
          const expectedValue =
            JSON.stringify(series.dimension) ===
            JSON.stringify(rollupWithData.dimension)
              ? 7
              : 0;

          expect(totalBlobs[currentIdx - startIdx]).toBe(expectedValue);

          if (sort === "asc") {
            expect(startIdx + totalBlobs.length).toBe(
              result.data.timestamps.length
            );
          }
        }
      }
    );

    it("should include the last closed period when the cached closed periods end one day before", async () => {
      const lastClosedPeriodStart = currentPeriodStart.subtract(1, "day");

      try {
        // Cache the closed periods on the day before the current period
        vi.setSystemTime(lastClosedPeriodStart.add(12, "hour").toDate());
        await caller.getTimeseries(input);

        // The daily cache stays for some minutes after the end of the day
        vi.setSystemTime(currentPeriodStart.add(1, "minute").toDate());
        await insertCurrentPeriodRow({ totalBlobs: 7 });

        const result = await caller.getTimeseries({
          ...input,
          includeCurrentPeriod: "true",
        });

        expect(result.data.timestamps.slice(0, 2)).toEqual([
          currentPeriodStart.toDate(),
          lastClosedPeriodStart.toDate(),
        ]);
      } finally {
        vi.setSystemTime(fixtures.systemDate);
      }
    });

    it("should cache the closed periods with the same key as without the current period", async () => {
      await insertCurrentPeriodRow({ totalBlobs: 7 });

      const closedPeriodsKey = `trpc:query:getTimeseries:${superjson.stringify({
        input,
      })}`;

      await redis.del(closedPeriodsKey);
      await caller.getTimeseries({ ...input, includeCurrentPeriod: "true" });

      await expect(redis.exists(closedPeriodsKey)).resolves.toBe(1);
    });
  });
});
