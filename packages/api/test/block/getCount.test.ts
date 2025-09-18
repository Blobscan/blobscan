import { beforeAll, describe, expect, it } from "vitest";

import { fixtures } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { getFilteredBlocks, runFilterTests } from "../test-suites/filters";
import type { BlockCaller } from "./caller";
import { createBlockCaller } from "./caller";

describe("getCount", () => {
  let blockCaller: BlockCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    blockCaller = createBlockCaller(ctx);
  });

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
