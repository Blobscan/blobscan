import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import { appRouter } from "../src/app-router";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "./helpers";

describe("Transaction router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    runPaginationTestsSuite("transaction", (paginationInput) =>
      caller.tx.getAll(paginationInput).then(({ transactions }) => transactions)
    );

    runFiltersTestsSuite("transaction", (filterInput) =>
      caller.tx.getAll(filterInput).then(({ transactions }) => transactions)
    );

    runExpandsTestsSuite("transaction", ["block", "blob"], (input) =>
      caller.tx.getAll(input).then(({ transactions }) => transactions)
    );

    it("should get the total number of transactions", async () => {
      const expectedTotalTransactions = fixtures.canonicalTxs.length;

      await ctx.prisma.transactionOverallStats.increment({
        from: 0,
        to: 9999,
      });

      const { totalTransactions } = await caller.tx.getAll();

      expect(totalTransactions).toBe(expectedTotalTransactions);
    });

    it("should get the total number of transactions for a rollup", async () => {
      const expectedTotalTransactions = await ctx.prisma.transaction.count({
        where: {
          rollup: "BASE",
        },
      });

      const { totalTransactions } = await caller.tx.getAll({
        rollup: "base",
      });

      expect(totalTransactions).toBe(expectedTotalTransactions);
    });
  });

  describe("getByHash", () => {
    runExpandsTestsSuite(
      "transaction",
      ["block", "blob", "blob_data"],
      (expandsInput) =>
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
});
