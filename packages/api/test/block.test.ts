/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import { createTestContext, runPaginationTestsSuite } from "./helpers";

// type Input = inferProcedureInput<AppRouter["block"]["getByBlockIdFull"]>;

describe("Block router", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = appRouter.createCaller(ctx);
  });

  describe.each([{ functionName: "getAll" }, { functionName: "getAllFull" }])(
    "$functionName",
    ({ functionName }) => {
      runPaginationTestsSuite("block", (paginationInput) =>
        // @ts-ignore
        caller.block[functionName](paginationInput).then(({ blocks }) => blocks)
      );

      it("should the total number of blocks correctly", async () => {
        const expectedTotalBlocks = fixtures.blocks.length;

        await ctx.prisma.blockOverallStats.populate();
        await caller.block.getAllFull();

        // @ts-ignore
        const { totalBlocks } = await caller.block[functionName]();

        expect(totalBlocks).toBe(expectedTotalBlocks);
      });
    }
  );

  describe.each([
    { functionName: "getByBlockId" },
    { functionName: "getByBlockIdFull" },
  ])("$functionName", ({ functionName }) => {
    // it("should get a block by hash", async () => {
    //   const input: Input = {
    //     id: "blockHash001",
    //   };

    //   const result = await caller.block[
    //     functionName as keyof typeof caller.block
    //   ](input);
    //   expect(result).toMatchSnapshot();
    // });

    it("should fail when trying to get a block with an invalid hash", async () => {
      await expect(
        caller.block[functionName as keyof typeof caller.block]({
          id: "invalidHash",
        })
      ).rejects.toThrow();
    });

    it("should fail when trying to get a block with a non-existent hash", async () => {
      const invalidHash =
        "0x0132d67fc77e26737632ebda918c689f146196dcd0dc5eab95ab7875cef95ef9";
      await expect(
        caller.block[functionName as keyof typeof caller.block]({
          id: invalidHash,
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '${invalidHash}'.`,
        })
      );
    });

    it("should get a block by block number", async () => {
      type Input = inferProcedureInput<AppRouter["block"]["getByBlockIdFull"]>;
      const input: Input = {
        id: "1002",
      };

      const result = await caller.block[
        functionName as keyof typeof caller.block
      ](input);
      expect(result).toMatchSnapshot();
    });

    it("should fail when trying to get a block with a non-existent block number", async () => {
      await expect(
        caller.block[functionName as keyof typeof caller.block]({
          id: "9999",
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '9999'.`,
        })
      );
    });
  });
});
