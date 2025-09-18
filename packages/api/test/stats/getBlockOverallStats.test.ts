import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { omitDBTimestampFields } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import type { StatsCaller } from "./caller";
import { createStatsCaller } from "./caller";

describe("getBlockOverallStats", () => {
  let caller: StatsCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();

    caller = createStatsCaller(ctx);
  });

  beforeEach(async () => {
    await ctx.prisma.overallStats.aggregate();
  });

  it("should return the correct overall stats", async () => {
    const blockOverallStats = await caller
      .getBlockOverallStats()
      .then(omitDBTimestampFields);

    expect(blockOverallStats).toMatchInlineSnapshot(`
        {
          "avgBlobAsCalldataFee": 22162.5,
          "avgBlobFee": 5160960,
          "avgBlobGasPrice": 21.75,
          "totalBlobAsCalldataFee": 354600n,
          "totalBlobAsCalldataGasUsed": 16300n,
          "totalBlobFee": 82575360n,
          "totalBlobGasUsed": 3801088n,
          "totalBlocks": 8,
        }
      `);
  });
});
