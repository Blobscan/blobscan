import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "../helpers";
import { createTransactionCaller } from "./caller";
import type { TxCaller } from "./caller";

describe("getAll", () => {
  let txCaller: TxCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    txCaller = createTransactionCaller(ctx);
  });

  beforeEach(async () => {
    await ctx.prisma.overallStats.aggregate();
  });

  runPaginationTestsSuite("transaction", (paginationInput) =>
    txCaller
      .getAll(paginationInput)
      .then(({ transactions, totalTransactions }) => ({
        items: transactions,
        totalItems: totalTransactions,
      }))
  );

  runFiltersTestsSuite("transaction", (filterInput) =>
    txCaller.getAll(filterInput).then(({ transactions }) => transactions)
  );

  runExpandsTestsSuite("transaction", ["block", "blob"], (input) =>
    txCaller.getAll(input).then(({ transactions }) => transactions)
  );

  it("should get the total number of transactions", async () => {
    const expectedTotalTransactions = fixtures.canonicalTxs.length;

    const { totalTransactions } = await txCaller.getAll({ count: true });

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

    const { totalTransactions } = await txCaller.getAll({
      count: true,
      rollups: "base",
    });

    expect(totalTransactions).toBe(expectedTotalTransactions);
  });
});
