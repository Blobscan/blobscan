import { beforeAll, describe, expect, it } from "vitest";

import type { DailyMetrics, Prisma } from "@blobscan/db";
import type { Rollup } from "@blobscan/db/prisma/enums";

import type { TRPCContext } from "../../src";
import { createTestContext, generateDailyCounts } from "../helpers";
import {
  getFilteredTransactions,
  requiresDirectCount,
  runFilterTests,
} from "../test-suites/filters";
import type { TxCaller } from "./caller";
import { createTransactionCaller } from "./caller";

describe("getCount", () => {
  let txCaller: TxCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    txCaller = createTransactionCaller(ctx);
  });

  // To test that the procedure retrieves the count from the metrics tables rather than
  // performing a direct database count, we stored an arbitrary total value in the metrics tables
  // in each test, intentionally different from the actual number of items in the database.
  // This setup allows us to verify that the procedure correctly uses the metrics tables count
  // instead of performing a direct database count.

  const STATS_TOTAL_TRANSACTIONS = 999999;

  async function createNewDailyMetrics(dailyMetrics: Partial<DailyMetrics>) {
    const data: Prisma.DailyMetricsCreateManyInput = {
      periodStart: new Date(),
      category: null,
      rollup: null,
      totalTransactions: 0,
      totalBlobAsCalldataFee: 0,
      totalBlobAsCalldataGasUsed: 0,
      totalBlobAsCalldataMaxFee: 0,
      totalBlobBaseFee: 0,
      totalBlobMaxFee: 0,
      totalBlobGasUsed: 0,
      totalUniqueReceivers: 0,
      totalUniqueSenders: 0,
      ...dailyMetrics,
    };

    await ctx.prisma.dailyMetrics.create({
      data,
    });
  }

  it("should count txs correctly when no filters are provided", async () => {
    const expectedTotalTransactions = STATS_TOTAL_TRANSACTIONS;

    await ctx.prisma.allTimeMetrics.create({
      data: {
        category: null,
        rollup: null,
        totalTransactions: expectedTotalTransactions,
      },
    });

    const { totalTransactions } = await txCaller.getCount({});

    expect(totalTransactions).toBe(expectedTotalTransactions);
  });

  runFilterTests(async (queryParamFilters) => {
    const directCountRequired = requiresDirectCount(queryParamFilters);
    let expectedTotalTransactions = 0;

    if (directCountRequired) {
      expectedTotalTransactions =
        getFilteredTransactions(queryParamFilters).length;
    } else {
      const rollups = queryParamFilters.rollups
        ?.split(",")
        .map((r) => r.toUpperCase() as Rollup);

      const { startDate, endDate } = queryParamFilters;
      const dateFilterEnabled = startDate || endDate;

      if (dateFilterEnabled) {
        const dailyCounts = generateDailyCounts(
          { from: startDate, to: endDate },
          STATS_TOTAL_TRANSACTIONS
        );
        expectedTotalTransactions = dailyCounts.reduce(
          (acc, { count }) => acc + count,
          0
        );

        if (rollups?.length) {
          await Promise.all(
            rollups.map((r) =>
              dailyCounts.map(({ day, count }) =>
                createNewDailyMetrics({
                  periodStart: day,
                  totalTransactions: count,
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
              totalTransactions: count,
              category: null,
              rollup: null,
            })
          )
        );
      } else {
        expectedTotalTransactions = STATS_TOTAL_TRANSACTIONS;

        if (rollups?.length) {
          await Promise.all(
            rollups.map((r) =>
              ctx.prisma.allTimeMetrics.create({
                data: {
                  totalTransactions: expectedTotalTransactions,
                  category: null,
                  rollup: r,
                },
              })
            )
          );
        }

        await ctx.prisma.allTimeMetrics.create({
          data: {
            totalTransactions: expectedTotalTransactions,
            category: null,
            rollup: null,
          },
        });
      }
    }

    const { totalTransactions } = await txCaller.getCount(queryParamFilters);

    const expectMsg = directCountRequired
      ? "Expect count to match direct count"
      : "Expect count to match precomputed aggregated stats value";

    expect(totalTransactions, expectMsg).toBe(expectedTotalTransactions);
  });
});
