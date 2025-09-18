import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { omitDBTimestampFields } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import type { StatsCaller } from "./caller";
import { createStatsCaller } from "./caller";

describe("getTransactionOverallStats", () => {
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
    const result = await caller
      .getTransactionOverallStats()
      .then(omitDBTimestampFields);

    expect(omitDBTimestampFields(result)).toMatchInlineSnapshot(`
        {
          "avgMaxBlobGasFee": 101.875,
          "totalTransactions": 16,
          "totalUniqueReceivers": 4,
          "totalUniqueSenders": 7,
        }
      `);
  });
});
