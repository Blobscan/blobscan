import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { omitDBTimestampFields } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { createStatsCaller } from "./caller";
import type { StatsCaller } from "./caller";

describe("getOverall", () => {
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
    const overallStats = await caller
      .getOverall()
      .then((stats) => stats.map((s) => omitDBTimestampFields(s)));

    expect(overallStats).toMatchInlineSnapshot(`
      [
        {
          "avgBlobAsCalldataFee": 22162.5,
          "avgBlobAsCalldataMaxFee": 104062.5,
          "avgBlobFee": 5160960,
          "avgBlobGasPrice": 21.75,
          "avgBlobMaxFee": 24166400,
          "avgBlobUsageSize": 736.9655172413793,
          "avgMaxBlobGasFee": 101.875,
          "category": null,
          "rollup": null,
          "totalBlobAsCalldataFee": 354600n,
          "totalBlobAsCalldataGasUsed": 16300n,
          "totalBlobAsCalldataMaxFees": 1665000n,
          "totalBlobFee": 82575360n,
          "totalBlobGasPrice": 348n,
          "totalBlobGasUsed": 3801088n,
          "totalBlobMaxFees": 386662400n,
          "totalBlobMaxGasFees": 1630n,
          "totalBlobSize": 422616n,
          "totalBlobUsageSize": 21372n,
          "totalBlobs": 29,
          "totalBlocks": 8,
          "totalTransactions": 16,
          "totalUniqueBlobs": 9,
          "totalUniqueReceivers": 4,
          "totalUniqueSenders": 7,
        },
      ]
    `);
  });
});
