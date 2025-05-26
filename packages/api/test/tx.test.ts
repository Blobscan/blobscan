import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { DailyStats, Prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import type { Rollup } from "../enums";
import type { TRPCContext } from "../src";
import { appRouter } from "../src/app-router";
import {
  createTestContext,
  generateDailyCounts,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "./helpers";
import {
  getFilteredTransactions,
  requiresDirectCount,
  runFilterTests,
} from "./test-suites/filters";

describe("Transaction router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    beforeEach(async () => {
      await ctx.prisma.overallStats.aggregate();
    });

    runPaginationTestsSuite("transaction", (paginationInput) =>
      caller.tx
        .getAll(paginationInput)
        .then(({ transactions, totalTransactions }) => ({
          items: transactions,
          totalItems: totalTransactions,
        }))
    );

    runFiltersTestsSuite("transaction", (filterInput) =>
      caller.tx.getAll(filterInput).then(({ transactions }) => transactions)
    );

    runExpandsTestsSuite("transaction", ["block", "blob"], (input) =>
      caller.tx.getAll(input).then(({ transactions }) => transactions)
    );

    it("should get the total number of transactions", async () => {
      const expectedTotalTransactions = fixtures.canonicalTxs.length;

      const { totalTransactions } = await caller.tx.getAll({ count: true });

      expect(totalTransactions).toBe(expectedTotalTransactions);
    });

    it("should get the total number of transactions for a rollup", async () => {
      const expectedTotalTransactions = await ctx.prisma.transaction.count({
        where: {
          from: {
            rollup: "BASE",
          },
        },
      });

      const { totalTransactions } = await caller.tx.getAll({
        count: true,
        rollups: "base",
      });

      expect(totalTransactions).toBe(expectedTotalTransactions);
    });
  });

  describe("getByHash", () => {
    runExpandsTestsSuite("transaction", ["block", "blob"], (expandsInput) =>
      caller.tx.getByHash({ hash: "txHash001", ...expandsInput })
    );

    it("should get a transaction by hash correctly", async () => {
      const result = await caller.tx.getByHash({
        hash: "txHash001",
      });

      expect(result).toMatchSnapshot();
    });

    it("should fail when providing a non-existent hash", async () => {
      await expect(
        caller.tx.getByHash({
          hash: "nonExistingHash",
        })
      ).rejects.toMatchSnapshot(
        "[TRPCError: No transaction with hash 'nonExistingHash' found]"
      );
    });
  });

  describe("getCount", () => {
    // To test that the procedure retrieves the count from the stats table rather than
    // performing a direct database count, we stored an arbitrary total blobs value in the stats table
    // in each test, intentionally different from the actual number of blobs in the database.
    // This setup allows us to verify that the procedure correctly uses the stats table count
    // instead of performing a direct database count.

    const STATS_TOTAL_TRANSACTIONS = 999999;

    async function createNewDailyStats(dailyStats: Partial<DailyStats>) {
      const data: Prisma.DailyStatsCreateManyInput = {
        day: new Date(),
        category: null,
        rollup: null,
        totalTransactions: 0,
        avgBlobFee: 0,
        avgBlobGasPrice: 0,
        avgBlobMaxFee: 0,
        avgMaxBlobGasFee: 0,
        totalBlobAsCalldataFee: 0,
        totalBlobAsCalldataGasUsed: 0,
        totalBlobAsCalldataMaxFees: 0,
        totalBlobFee: 0,
        totalBlobMaxFees: 0,
        totalBlobGasUsed: 0,
        totalUniqueReceivers: 0,
        totalUniqueSenders: 0,
        avgBlobAsCalldataFee: 0,
        avgBlobAsCalldataMaxFee: 0,
        ...dailyStats,
      };

      await ctx.prisma.dailyStats.create({
        data,
      });
    }

    it("should count txs correctly when no filters are provided", async () => {
      const expectedTotalTransactions = STATS_TOTAL_TRANSACTIONS;

      await ctx.prisma.overallStats.create({
        data: {
          category: null,
          rollup: null,
          totalTransactions: expectedTotalTransactions,
        },
      });

      const { totalTransactions } = await caller.tx.getCount({});

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
                  createNewDailyStats({
                    day,
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
              createNewDailyStats({
                day,
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
                ctx.prisma.overallStats.create({
                  data: {
                    totalTransactions: expectedTotalTransactions,
                    category: null,
                    rollup: r,
                  },
                })
              )
            );
          }

          await ctx.prisma.overallStats.create({
            data: {
              totalTransactions: expectedTotalTransactions,
              category: null,
              rollup: null,
            },
          });
        }
      }

      const { totalTransactions } = await caller.tx.getCount(queryParamFilters);

      const expectMsg = directCountRequired
        ? "Expect count to match direct count"
        : "Expect count to match precomputed aggregated stats value";

      expect(totalTransactions, expectMsg).toBe(expectedTotalTransactions);
    });
  });
});
