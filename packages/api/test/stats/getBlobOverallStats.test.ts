import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { omitDBTimestampFields } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { createStatsCaller } from "./caller";
import type { StatsCaller } from "./caller";

describe("getBlobOverallStats", () => {
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
    const blobOverallStats = await caller.getBlobOverallStats();

    expect(omitDBTimestampFields(blobOverallStats)).toMatchInlineSnapshot(`
        {
          "totalBlobSize": 422616n,
          "totalBlobs": 29,
          "totalUniqueBlobs": 9,
        }
      `);
  });
});
