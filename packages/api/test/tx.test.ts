/* eslint-disable @typescript-eslint/ban-ts-comment */

import type { inferProcedureInput } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import { createTestContext, runPaginationTestsSuite } from "./helpers";

type GetByHashInput = inferProcedureInput<AppRouter["tx"]["getByHashFull"]>;

describe("Transaction router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe.each([{ functionName: "getAll" }, { functionName: "getAllFull" }])(
    "$functionName",
    ({ functionName }) => {
      it("should get the total number of transactions", async () => {
        const expectedTotalTransactions = fixtures.txs.length;

        await ctx.prisma.transactionOverallStats.populate();

        // @ts-ignore
        const { totalTransactions } = await caller.tx[functionName]();

        expect(totalTransactions).toBe(expectedTotalTransactions);
      });

      runPaginationTestsSuite("transaction", (paginationInput) =>
        // @ts-ignore
        caller.tx[functionName](paginationInput).then(
          // @ts-ignore
          ({ transactions }) => transactions
        )
      );
    }
  );

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
        "[TRPCError: No transaction with hash 'nonExistingHash'.]"
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
