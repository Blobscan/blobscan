import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import dayjs from "@blobscan/dayjs";
import { fixtures, redis } from "@blobscan/test";

import type { TRPCContext } from "../../src";
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
  const input: Parameters<typeof caller.getTimeseries>[0] = {
    timeFrame: "7d",
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
      await insertCurrentPeriodRow({ totalBlobs: 7 });

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
