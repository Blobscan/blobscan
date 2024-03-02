import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import { createTestContext, runPaginationTestsSuite } from "./helpers";

type Input = inferProcedureInput<AppRouter["block"]["getByBlockIdFull"]>;

describe("Block router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getAllFull", () => {
    runPaginationTestsSuite("block", (paginationInput) =>
      caller.block.getAllFull(paginationInput).then(({ blocks }) => blocks)
    );

    it("should the total number of blocks correctly", async () => {
      const expectedTotalBlocks = fixtures.blocks.length;

      await ctx.prisma.blockOverallStats.populate();
      await caller.block.getAllFull();

      const { totalBlocks } = await caller.block.getAllFull();

      expect(totalBlocks).toBe(expectedTotalBlocks);
    });
  });

  describe("getByIdFull", () => {
    it("should get a block by hash", async () => {
      const input: Input = {
        id: "blockHash001",
      };

      const result = await caller.block.getByBlockIdFull(input);
      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a block with a non-existent hash", async () => {
      await expect(
        caller.block.getByBlockIdFull({
          id: "nonExistingHash",
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with number, slot or hash 'nonExistingHash'.`,
        })
      );
    });
  });

  it("should get a block by slot", async () => {
    const input: Input = {
      id: "101",
    };

    const result = await caller.block.getByBlockIdFull(input);
    expect(result).toMatchSnapshot();
  });

  it("should fail when trying to get a block with a non-existent slot", async () => {
    await expect(
      caller.block.getByBlockIdFull({
        id: "nonExistingSlot",
      })
    ).rejects.toThrow(
      new TRPCError({
        code: "NOT_FOUND",
        message: `No block with number, slot or hash 'nonExistingSlot'.`,
      })
    );
  });

  it("should get a block by block number", async () => {
    type Input = inferProcedureInput<AppRouter["block"]["getByBlockIdFull"]>;
    const input: Input = {
      id: "1002",
    };

    const result = await caller.block.getByBlockIdFull(input);
    expect(result).toMatchSnapshot();
  });

  it("should fail when trying to get a block with a non-existent block number", async () => {
    await expect(
      caller.block.getByBlockIdFull({
        id: "9999",
      })
    ).rejects.toThrow(
      new TRPCError({
        code: "NOT_FOUND",
        message: `No block with number, slot or hash '9999'.`,
      })
    );
  });
});
