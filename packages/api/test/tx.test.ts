import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import { createTestContext, runPaginationTestsSuite } from "./helpers";

type GetByHashInput = inferProcedureInput<AppRouter["tx"]["getByHash"]>;

describe("Transaction router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    it("should get the total number of transactions", async () => {
      const expectedTotalTransactions = fixtures.txs.length;

      await ctx.prisma.transactionOverallStats.backfill();

      const { totalTransactions } = await caller.tx.getAll();

      expect(totalTransactions).toBe(expectedTotalTransactions);
    });

    runPaginationTestsSuite("transaction", (paginationInput) =>
      caller.tx.getAll(paginationInput).then(({ transactions }) => transactions)
    );
  });

  describe("getByHash", () => {
    it("should get a transaction by hash correctly", async () => {
      const input: GetByHashInput = {
        hash: "txHash001",
      };

      const result = await caller.tx.getByHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should fail when providing a non-existent hash", async () => {
      await expect(
        caller.tx.getByHash({
          hash: "nonExistingHash",
        })
      ).rejects.toMatchInlineSnapshot(
        "[TRPCError: No tx with hash 'nonExistingHash']"
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
