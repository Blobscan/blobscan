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
      .then((res) => res.data.map((s) => omitDBTimestampFields(s)));

    expect(overallStats).toMatchInlineSnapshot(`
      [
        {
          "dimension": {
            "name": "other",
            "type": "category",
          },
          "metrics": {
            "avgBlobAsCalldataFee": 22022.22222222222,
            "avgBlobAsCalldataMaxFee": 102333.3333333333,
            "avgBlobFee": 4776846.222222222,
            "avgBlobGasPrice": 21.77777777777778,
            "avgBlobMaxFee": 21990968.88888889,
            "avgBlobUsageSize": 691.4666666666667,
            "avgMaxBlobGasFee": 101.1111111111111,
            "totalBlobAsCalldataFee": 198200n,
            "totalBlobAsCalldataGasUsed": 9100n,
            "totalBlobAsCalldataMaxFees": 921000n,
            "totalBlobFee": 42991616n,
            "totalBlobGasPrice": 196n,
            "totalBlobGasUsed": 1966080n,
            "totalBlobMaxFees": 197918720n,
            "totalBlobMaxGasFees": 910n,
            "totalBlobSize": 16900n,
            "totalBlobUsageSize": 10372n,
            "totalBlobs": 15,
            "totalBlocks": 6,
            "totalTransactions": 9,
            "totalUniqueBlobs": 4,
            "totalUniqueReceivers": 3,
            "totalUniqueSenders": 4,
          },
        },
        {
          "dimension": {
            "name": "rollup",
            "type": "category",
          },
          "metrics": {
            "avgBlobAsCalldataFee": 22342.85714285714,
            "avgBlobAsCalldataMaxFee": 106285.7142857143,
            "avgBlobFee": 5654820.571428572,
            "avgBlobGasPrice": 21.71428571428572,
            "avgBlobMaxFee": 26963382.85714286,
            "avgBlobUsageSize": 785.7142857142857,
            "avgMaxBlobGasFee": 102.8571428571429,
            "totalBlobAsCalldataFee": 156400n,
            "totalBlobAsCalldataGasUsed": 7200n,
            "totalBlobAsCalldataMaxFees": 744000n,
            "totalBlobFee": 39583744n,
            "totalBlobGasPrice": 152n,
            "totalBlobGasUsed": 1835008n,
            "totalBlobMaxFees": 188743680n,
            "totalBlobMaxGasFees": 720n,
            "totalBlobSize": 405716n,
            "totalBlobUsageSize": 11000n,
            "totalBlobs": 14,
            "totalBlocks": 5,
            "totalTransactions": 7,
            "totalUniqueBlobs": 7,
            "totalUniqueReceivers": 4,
            "totalUniqueSenders": 3,
          },
        },
        {
          "dimension": {
            "name": "arbitrum",
            "type": "rollup",
          },
          "metrics": {
            "avgBlobAsCalldataFee": 22000,
            "avgBlobAsCalldataMaxFee": 100000,
            "avgBlobFee": 2883584,
            "avgBlobGasPrice": 22,
            "avgBlobMaxFee": 13107200,
            "avgBlobUsageSize": 1000,
            "avgMaxBlobGasFee": 100,
            "totalBlobAsCalldataFee": 22000n,
            "totalBlobAsCalldataGasUsed": 1000n,
            "totalBlobAsCalldataMaxFees": 100000n,
            "totalBlobFee": 2883584n,
            "totalBlobGasPrice": 22n,
            "totalBlobGasUsed": 131072n,
            "totalBlobMaxFees": 13107200n,
            "totalBlobMaxGasFees": 100n,
            "totalBlobSize": 1100n,
            "totalBlobUsageSize": 1000n,
            "totalBlobs": 1,
            "totalBlocks": 1,
            "totalTransactions": 1,
            "totalUniqueBlobs": 0,
            "totalUniqueReceivers": 1,
            "totalUniqueSenders": 1,
          },
        },
        {
          "dimension": {
            "name": "base",
            "type": "rollup",
          },
          "metrics": {
            "avgBlobAsCalldataFee": 22000,
            "avgBlobAsCalldataMaxFee": 100000,
            "avgBlobFee": 5767168,
            "avgBlobGasPrice": 22,
            "avgBlobMaxFee": 26214400,
            "avgBlobUsageSize": 25,
            "avgMaxBlobGasFee": 100,
            "totalBlobAsCalldataFee": 44000n,
            "totalBlobAsCalldataGasUsed": 2000n,
            "totalBlobAsCalldataMaxFees": 200000n,
            "totalBlobFee": 11534336n,
            "totalBlobGasPrice": 44n,
            "totalBlobGasUsed": 524288n,
            "totalBlobMaxFees": 52428800n,
            "totalBlobMaxGasFees": 200n,
            "totalBlobSize": 394616n,
            "totalBlobUsageSize": 100n,
            "totalBlobs": 4,
            "totalBlocks": 2,
            "totalTransactions": 2,
            "totalUniqueBlobs": 4,
            "totalUniqueReceivers": 2,
            "totalUniqueSenders": 1,
          },
        },
        {
          "dimension": {
            "name": "optimism",
            "type": "rollup",
          },
          "metrics": {
            "avgBlobAsCalldataFee": 22600,
            "avgBlobAsCalldataMaxFee": 111000,
            "avgBlobFee": 6291456,
            "avgBlobGasPrice": 21.5,
            "avgBlobMaxFee": 30801920,
            "avgBlobUsageSize": 1100,
            "avgMaxBlobGasFee": 105,
            "totalBlobAsCalldataFee": 90400n,
            "totalBlobAsCalldataGasUsed": 4200n,
            "totalBlobAsCalldataMaxFees": 444000n,
            "totalBlobFee": 25165824n,
            "totalBlobGasPrice": 86n,
            "totalBlobGasUsed": 1179648n,
            "totalBlobMaxFees": 123207680n,
            "totalBlobMaxGasFees": 420n,
            "totalBlobSize": 10000n,
            "totalBlobUsageSize": 9900n,
            "totalBlobs": 9,
            "totalBlocks": 4,
            "totalTransactions": 4,
            "totalUniqueBlobs": 3,
            "totalUniqueReceivers": 3,
            "totalUniqueSenders": 1,
          },
        },
        {
          "dimension": {
            "type": "global",
          },
          "metrics": {
            "avgBlobAsCalldataFee": 22162.5,
            "avgBlobAsCalldataMaxFee": 104062.5,
            "avgBlobFee": 5160960,
            "avgBlobGasPrice": 21.75,
            "avgBlobMaxFee": 24166400,
            "avgBlobUsageSize": 736.9655172413793,
            "avgMaxBlobGasFee": 101.875,
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
        },
      ]
    `);
  });
});
