import { beforeAll, describe, expect, it } from "vitest";

import type { DailyStats, Prisma } from "@blobscan/db";
import type { Rollup } from "@blobscan/db/prisma/enums";

import type { TRPCContext } from "../../src";
import { createTestContext, generateDailyCounts } from "../helpers";
import {
  getFilteredBlobs,
  requiresDirectCount,
  runFilterTests,
} from "../test-suites/filters";
import { createBlobCaller } from "./caller";
import type { BlobCaller } from "./caller";

describe("getCount", () => {
  let blobCaller: BlobCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blobCaller = createBlobCaller(ctx);
  });

  // To test that the procedure retrieves the count from the stats table rather than
  // performing a direct database count, we stored an arbitrary total blobs value in the stats table
  // in each test, intentionally different from the actual number of blobs in the database.
  // This setup allows us to verify that the procedure correctly uses the stats table count
  // instead of performing a direct database count.
  const STATS_TOTAL_BLOBS = 999999;

  async function createNewDailyStats(dailyStats: Partial<DailyStats>) {
    const data: Prisma.DailyStatsCreateInput = {
      day: new Date(),
      category: null,
      rollup: null,
      totalBlobs: 0,
      totalBlobSize: 0,
      totalUniqueBlobs: 0,
      ...dailyStats,
    };

    await ctx.prisma.dailyStats.create({
      data,
    });
  }

  it("should return the overall total blobs stat when no filters are provided", async () => {
    const expectedTotalBlobs = STATS_TOTAL_BLOBS;

    await ctx.prisma.overallStats.create({
      data: {
        category: null,
        rollup: null,
        totalBlobs: expectedTotalBlobs,
      },
    });
    const { totalBlobs } = await blobCaller.getCount({});

    expect(totalBlobs).toBe(expectedTotalBlobs);
  });

  runFilterTests(async (queryParamFilters) => {
    const directCountRequired = requiresDirectCount(queryParamFilters);
    let expectedTotalBlobs = 0;

    if (directCountRequired) {
      expectedTotalBlobs = getFilteredBlobs(queryParamFilters).length;
    } else {
      const rollups = queryParamFilters.rollups
        ?.split(",")
        .map((r) => r.toUpperCase() as Rollup);

      const { startDate, endDate } = queryParamFilters;
      const dateFilterEnabled = startDate || endDate;

      if (dateFilterEnabled) {
        const dailyCounts = generateDailyCounts(
          { from: startDate, to: endDate },
          STATS_TOTAL_BLOBS
        );
        expectedTotalBlobs = dailyCounts.reduce(
          (acc, { count }) => acc + count,
          0
        );

        if (rollups?.length) {
          await Promise.all(
            rollups.map((r) =>
              dailyCounts.map(({ day, count }) =>
                createNewDailyStats({
                  day,
                  totalBlobs: count,
                  category: null,
                  rollup: r,
                })
              )
            )
          );
        }

        await Promise.all(
          dailyCounts.map(({ day, count }) =>
            createNewDailyStats({
              day,
              category: null,
              rollup: null,
              totalBlobs: count,
            })
          )
        );
      } else {
        expectedTotalBlobs = STATS_TOTAL_BLOBS;

        if (rollups?.length) {
          await Promise.all(
            rollups.map((r) =>
              ctx.prisma.overallStats.create({
                data: {
                  totalBlobs: expectedTotalBlobs,
                  category: null,
                  rollup: r,
                },
              })
            )
          );
        }

        await ctx.prisma.overallStats.create({
          data: {
            category: null,
            rollup: null,
            totalBlobs: expectedTotalBlobs,
          },
        });
      }
    }

    const { totalBlobs } = await blobCaller.getCount(queryParamFilters);

    expect(totalBlobs).toBe(expectedTotalBlobs);
  });
});
