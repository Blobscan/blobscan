/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { Rollup } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import {
  createTestContext,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "./helpers";

type GetByHashInput = inferProcedureInput<AppRouter["tx"]["getByHashFull"]>;

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

    it("should get the total number of transactions", async () => {
      const expectedTotalTransactions = fixtures.txs.length;

      await ctx.prisma.transactionOverallStats.populate();

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

  describe.each([
    { functionName: "getByHash" },
    { functionName: "getByHashFull" },
  ])("$functionName", ({ functionName }) => {
    it("should get a transaction by hash correctly", async () => {
      const input: GetByHashInput = {
        hash: "txHash001",
      };

      // @ts-ignore
      const result = await caller.tx[functionName](input);
      expect(result).toMatchSnapshot();
    });

    it("should fail when providing a non-existent hash", async () => {
      await expect(
        // @ts-ignore
        caller.tx[functionName]({
          hash: "nonExistingHash",
        })
      ).rejects.toMatchSnapshot(
        "[TRPCError: No transaction with hash 'nonExistingHash' found]"
      );
    });
  });

  describe("getByAddress", () => {
    const address = "address2";

    runPaginationTestsSuite("address's transactions", (paginationInput) =>
      caller.tx
        .getByAddress({ ...paginationInput, address })
        .then(({ transactions }) => transactions)
    );

    it("should return the total number of transactions for an address", async () => {
      const expectedTotalAddressTransactions = fixtures.txs.filter(
        (tx) => tx.fromId === address || tx.toId === address
      ).length;
      const { totalTransactions } = await caller.tx.getByAddress({ address });

      expect(totalTransactions).toBe(expectedTotalAddressTransactions);
    });
  });
});
