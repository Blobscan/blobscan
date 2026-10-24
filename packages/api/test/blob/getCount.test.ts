import { beforeAll, describe, expect, it } from "vitest";

import type { DailyMetrics, Prisma } from "@blobscan/db";
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

  // To test that the procedure retrieves the count from the metrics tables rather than
  // performing a direct database count, we stored an arbitrary total value in the metrics tables
  // in each test, intentionally different from the actual number of items in the database.
  // This setup allows us to verify that the procedure correctly uses the metrics tables count
  // instead of performing a direct database count.
  const STATS_TOTAL_BLOBS = 999999;

  async function createNewDailyMetrics(dailyMetrics: Partial<DailyMetrics>) {
    const data: Prisma.DailyMetricsCreateInput = {
      periodStart: new Date(),
      category: null,
      rollup: null,
      totalBlobs: 0,
      totalBlobSize: 0,
      totalUniqueBlobs: 0,
      ...dailyMetrics,
    };

    await ctx.prisma.dailyMetrics.create({
      data,
    });
  }

  it("should return the overall total blobs stat when no filters are provided", async () => {
    const expectedTotalBlobs = STATS_TOTAL_BLOBS;

    await ctx.prisma.allTimeMetrics.create({
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
                createNewDailyMetrics({
                  periodStart: day,
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
            createNewDailyMetrics({
              periodStart: day,
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
              ctx.prisma.allTimeMetrics.create({
                data: {
                  totalBlobs: expectedTotalBlobs,
                  category: null,
                  rollup: r,
                },
              })
            )
          );
        }

        await ctx.prisma.allTimeMetrics.create({
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
