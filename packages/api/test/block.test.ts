import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import { createTestContext, runPaginationTestsSuite } from "./helpers";

type Input = inferProcedureInput<AppRouter["block"]["getByHash"]>;

describe("Block router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    runPaginationTestsSuite("block", (paginationInput) =>
      caller.block.getAll(paginationInput).then(({ blocks }) => blocks)
    );

    it("should the total number of blocks correctly", async () => {
      const expectedTotalBlocks = fixtures.blocks.length;

      await ctx.prisma.blockOverallStats.backfill();
      await caller.block.getAll();

      const { totalBlocks } = await caller.block.getAll();

      expect(totalBlocks).toBe(expectedTotalBlocks);
    });
  });

  describe("getByHash", () => {
    it("should get a block by hash", async () => {
      const input: Input = {
        hash: "blockHash001",
      };

      const result = await caller.block.getByHash(input);
      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a block with a non-existent hash", async () => {
      await expect(
        caller.block.getByHash({
          hash: "nonExistingHash",
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with hash 'nonExistingHash'`,
        })
      );
    });
  });

  describe("getByBlockNumber", () => {
    it("should get a block by block number", async () => {
      type Input = inferProcedureInput<AppRouter["block"]["getByBlockNumber"]>;
      const input: Input = {
        number: 1002,
      };

      const result = await caller.block.getByBlockNumber(input);
      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a block with a non-existent block number", async () => {
      await expect(
        caller.block.getByBlockNumber({
          number: 9999,
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with number '9999'`,
        })
      );
    });
  });
});
