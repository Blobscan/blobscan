import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../src";
import type { AppRouter } from "../src/app-router";
import { appRouter } from "../src/app-router";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "./helpers";

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

    runFiltersTestsSuite("block", (filterInput) =>
      caller.block.getAll(filterInput).then(({ blocks }) => blocks)
    );

    runExpandsTestsSuite("block", ["transaction", "blob"], (expandInput) =>
      caller.block.getAll(expandInput).then(({ blocks }) => blocks)
    );

    it("should return the total number of blocks correctly", async () => {
      const expectedTotalBlocks = fixtures.canonicalBlocks.length;

      await ctx.prisma.blockOverallStats.increment({
        from: 0,
        to: 9999,
      });

      const { totalBlocks } = await caller.block.getAll();

      expect(totalBlocks).toBe(expectedTotalBlocks);
    });
  });

  describe("getByBlockId", () => {
    it("should get a block by hash", async () => {
      const result = await caller.block.getByBlockId({
        id: "0x00903f147f44929cdb385b595b2e745566fe50658362b4e3821fa52b5ebe8f06",
      });

      expect(result).toMatchSnapshot();
    });

    it("should get a block by block number", async () => {
      type Input = inferProcedureInput<AppRouter["block"]["getByBlockId"]>;
      const input: Input = {
        id: "1002",
      };

      const result = await caller.block.getByBlockId(input);
      expect(result).toMatchSnapshot();
    });

    it("should get a reorged block by block number", async () => {
      const result = await caller.block.getByBlockId({
        id: "1008",
        type: "reorged",
      });

      expect(result).toMatchSnapshot();
    });

    it("should get the canonical block when providing a block number matching a reorged block", async () => {
      const result = await caller.block.getByBlockId({
        id: "1008",
      });

      expect(result).toMatchSnapshot();
    });

    runExpandsTestsSuite(
      "block",
      ["transaction", "blob", "blob_data"],
      (expandInput) => caller.block.getByBlockId({ id: "1002", ...expandInput })
    );

    it("should fail when trying to get a block with an invalid hash", async () => {
      await expect(
        caller.block.getByBlockId({
          id: "invalidHash",
        })
      ).rejects.toThrow();
    });

    it("should fail when trying to get a block with a non-existent hash", async () => {
      const invalidHash =
        "0x0132d67fc77e26737632ebda918c689f146196dcd0dc5eab95ab7875cef95ef9";
      await expect(
        caller.block.getByBlockId({
          id: invalidHash,
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `No block with id '${invalidHash}'.`,
        })
      );
    });

    it("should fail when trying to get a block with a non-existent block number", async () => {
      await expect(
        caller.block.getByBlockId({
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
