import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import {
  createTestContext,
  runExpandsTestsSuite,
  runFiltersTestsSuite,
  runPaginationTestsSuite,
} from "../helpers";
import type { BlockCaller } from "./caller";
import { createBlockCaller } from "./caller";

describe("getAll", () => {
  let blockCaller: BlockCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blockCaller = createBlockCaller(ctx);
  });

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
