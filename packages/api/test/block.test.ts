import type { inferProcedureInput } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { fixtures, testValidError } from "@blobscan/test";

import type { TRPCContext } from "../src";
import { blockRouter } from "../src/routers/block";
import type { getByBlockId } from "../src/routers/block/getByBlockId";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "./helpers";
import { getFilteredBlocks, runFilterTests } from "./test-suites/filters";

describe("Block router", async () => {
  let blockCaller: ReturnType<typeof blockRouter.createCaller>;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blockCaller = blockRouter.createCaller(ctx);
  });

  describe("getAll", () => {
    beforeEach(async () => {
      await ctx.prisma.overallStats.aggregate();
    });

    runPaginationTestsSuite("block", (paginationInput) =>
      blockCaller.getAll(paginationInput).then(({ blocks, totalBlocks }) => ({
        items: blocks,
        totalItems: totalBlocks,
      }))
    );

    runFiltersTestsSuite("block", (filterInput) =>
      blockCaller.getAll(filterInput).then(({ blocks }) => blocks)
    );

    runExpandsTestsSuite("block", ["transaction", "blob"], (expandInput) =>
      blockCaller.getAll(expandInput).then(({ blocks }) => blocks)
    );

    it("should return the total number of blocks correctly", async () => {
      const expectedTotalBlocks = fixtures.canonicalBlocks.length;

      const { totalBlocks } = await blockCaller.getAll({ count: true });

      expect(totalBlocks).toBe(expectedTotalBlocks);
    });
  });

  describe("checkBlockExists", () => {
    it("should return true for an existing block", async () => {
      const result = await blockCaller.checkBlockExists({
        blockNumber: 1002,
      });

      expect(result).toBe(true);
    });

    it("should return false for a non-existent block", async () => {
      const result = await blockCaller.checkBlockExists({
        blockNumber: 99999999,
      });

      expect(result).toBe(false);
    });
  });

  describe("getByBlockId", () => {
    it("should get a block by hash", async () => {
      const result = await blockCaller.getByBlockId({
        id: "0x00903f147f44929cdb385b595b2e745566fe50658362b4e3821fa52b5ebe8f06",
      });

      expect(result).toMatchSnapshot();
    });

    it("should get a block by block number", async () => {
      type Input = inferProcedureInput<typeof getByBlockId>;
      const input: Input = {
        id: "1002",
      };

      const result = await blockCaller.getByBlockId(input);

      expect(result).toMatchSnapshot();
    });

    it("should get latest block", async () => {
      const result = await blockCaller.getByBlockId({
        id: "latest",
      });

      expect(result).toMatchSnapshot();
    });

    it("should get oldest block", async () => {
      const result = await blockCaller.getByBlockId({
        id: "oldest",
      });

      expect(result).toMatchSnapshot();
    });

    it("should get a reorged block by block number", async () => {
      const result = await blockCaller.getByBlockId({
        id: "1008",
        type: "reorged",
      });

      expect(result).toMatchSnapshot();
    });

    it("should get the canonical block when providing a block number matching a reorged block", async () => {
      const result = await blockCaller.getByBlockId({
        id: "1008",
      });

      expect(result).toMatchSnapshot();
    });

    runExpandsTestsSuite("block", ["transaction", "blob"], (expandInput) =>
      blockCaller.getByBlockId({ id: "1002", ...expandInput })
    );

    it("should fail when trying to get a block with an invalid hash", async () => {
      await expect(
        blockCaller.getByBlockId({
          id: "invalidHash",
        })
      ).rejects.toThrow();
    });

    it("should fail when trying to get a block with a non-existent hash", async () => {
      const invalidHash =
        "0x0132d67fc77e26737632ebda918c689f146196dcd0dc5eab95ab7875cef95ef9";
      await expect(
        blockCaller.getByBlockId({
          id: invalidHash,
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: `Block with id "${invalidHash}" not found`,
        })
      );
    });

    it("should fail when trying to get a block with a non-existent block number", async () => {
      await expect(
        blockCaller.getByBlockId({
          id: "9999",
        })
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: 'Block with id "9999" not found',
        })
      );
    });
  });

  describe("getBySlot", () => {
    it("should get a block by slot", async () => {
      const result = await blockCaller.getBySlot({
        slot: 101,
      });

      expect(result).toMatchSnapshot();
    });

    testValidError(
      "should fail when trying to get a reorged block by slot",
      async () => {
        await blockCaller.getBySlot({
          slot: 110,
        });
      },
      TRPCError
    );

    testValidError(
      "should fail when trying to get a block with a negative slot",
      async () => {
        await blockCaller.getBySlot({
          slot: -1,
        });
      },
      TRPCError,
      {
        checkCause: true,
      }
    );
  });

  describe("getCount", () => {
    it("should return the overall total blocks stat when no filters are provided", async () => {
      await ctx.prisma.overallStats.aggregate();
      const { totalBlocks } = await blockCaller.getCount({});

      expect(totalBlocks).toBe(fixtures.canonicalBlocks.length);
    });

    runFilterTests(async (filters) => {
      await ctx.prisma.overallStats.aggregate();
      const { totalBlocks } = await blockCaller.getCount(filters);

      expect(totalBlocks).toBe(getFilteredBlocks(filters).length);
    });
  });
});
