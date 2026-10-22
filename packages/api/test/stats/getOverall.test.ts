import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { omitDBTimestampFields } from "@blobscan/test";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { aggregateMetrics } from "../metrics";
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
    await aggregateMetrics(ctx.prisma);
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
            "avgBlobBaseFee": 4776846.222222222,
            "avgBlobGasPrice": null,
            "avgBlobMaxFee": 21990968.88888889,
            "avgBlobUsageSize": 691.4666666666667,
            "avgMaxBlobGasFee": 101.1111111111111,
            "totalBlobAsCalldataFee": 198200n,
            "totalBlobAsCalldataGasUsed": 9100n,
            "totalBlobAsCalldataMaxFee": 921000n,
            "totalBlobBaseFee": 42991616n,
            "totalBlobGasPrice": null,
            "totalBlobGasUsed": 1966080n,
            "totalBlobMaxFee": 197918720n,
            "totalBlobSize": 16900n,
            "totalBlobUsageSize": 10372n,
            "totalBlobs": 15,
            "totalBlocks": null,
            "totalMaxBlobGasFee": 910n,
            "totalTransactions": 9,
            "totalUniqueBlobs": 4,
            "totalUniqueReceivers": 2,
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
            "avgBlobBaseFee": 5654820.571428572,
            "avgBlobGasPrice": null,
            "avgBlobMaxFee": 26963382.85714286,
            "avgBlobUsageSize": 785.7142857142857,
            "avgMaxBlobGasFee": 102.8571428571429,
            "totalBlobAsCalldataFee": 156400n,
            "totalBlobAsCalldataGasUsed": 7200n,
            "totalBlobAsCalldataMaxFee": 744000n,
            "totalBlobBaseFee": 39583744n,
            "totalBlobGasPrice": null,
            "totalBlobGasUsed": 1835008n,
            "totalBlobMaxFee": 188743680n,
            "totalBlobSize": 405716n,
            "totalBlobUsageSize": 11000n,
            "totalBlobs": 14,
            "totalBlocks": null,
            "totalMaxBlobGasFee": 720n,
            "totalTransactions": 7,
            "totalUniqueBlobs": 7,
            "totalUniqueReceivers": 2,
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
            "avgBlobBaseFee": 2883584,
            "avgBlobGasPrice": null,
            "avgBlobMaxFee": 13107200,
            "avgBlobUsageSize": 1000,
            "avgMaxBlobGasFee": 100,
            "totalBlobAsCalldataFee": 22000n,
            "totalBlobAsCalldataGasUsed": 1000n,
            "totalBlobAsCalldataMaxFee": 100000n,
            "totalBlobBaseFee": 2883584n,
            "totalBlobGasPrice": null,
            "totalBlobGasUsed": 131072n,
            "totalBlobMaxFee": 13107200n,
            "totalBlobSize": 1100n,
            "totalBlobUsageSize": 1000n,
            "totalBlobs": 1,
            "totalBlocks": null,
            "totalMaxBlobGasFee": 100n,
            "totalTransactions": 1,
            "totalUniqueBlobs": 0,
            "totalUniqueReceivers": 0,
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
            "avgBlobBaseFee": 5767168,
            "avgBlobGasPrice": null,
            "avgBlobMaxFee": 26214400,
            "avgBlobUsageSize": 25,
            "avgMaxBlobGasFee": 100,
            "totalBlobAsCalldataFee": 44000n,
            "totalBlobAsCalldataGasUsed": 2000n,
            "totalBlobAsCalldataMaxFee": 200000n,
            "totalBlobBaseFee": 11534336n,
            "totalBlobGasPrice": null,
            "totalBlobGasUsed": 524288n,
            "totalBlobMaxFee": 52428800n,
            "totalBlobSize": 394616n,
            "totalBlobUsageSize": 100n,
            "totalBlobs": 4,
            "totalBlocks": null,
            "totalMaxBlobGasFee": 200n,
            "totalTransactions": 2,
            "totalUniqueBlobs": 4,
            "totalUniqueReceivers": 1,
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
            "avgBlobBaseFee": 6291456,
            "avgBlobGasPrice": null,
            "avgBlobMaxFee": 30801920,
            "avgBlobUsageSize": 1100,
            "avgMaxBlobGasFee": 105,
            "totalBlobAsCalldataFee": 90400n,
            "totalBlobAsCalldataGasUsed": 4200n,
            "totalBlobAsCalldataMaxFee": 444000n,
            "totalBlobBaseFee": 25165824n,
            "totalBlobGasPrice": null,
            "totalBlobGasUsed": 1179648n,
            "totalBlobMaxFee": 123207680n,
            "totalBlobSize": 10000n,
            "totalBlobUsageSize": 9900n,
            "totalBlobs": 9,
            "totalBlocks": null,
            "totalMaxBlobGasFee": 420n,
            "totalTransactions": 4,
            "totalUniqueBlobs": 3,
            "totalUniqueReceivers": 1,
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
            "avgBlobBaseFee": 5160960,
            "avgBlobGasPrice": 21.75,
            "avgBlobMaxFee": 24166400,
            "avgBlobUsageSize": 736.9655172413793,
            "avgMaxBlobGasFee": 101.875,
            "totalBlobAsCalldataFee": 354600n,
            "totalBlobAsCalldataGasUsed": 16300n,
            "totalBlobAsCalldataMaxFee": 1665000n,
            "totalBlobBaseFee": 82575360n,
            "totalBlobGasPrice": 174n,
            "totalBlobGasUsed": 3801088n,
            "totalBlobMaxFee": 386662400n,
            "totalBlobSize": 422616n,
            "totalBlobUsageSize": 21372n,
            "totalBlobs": 29,
            "totalBlocks": 8,
            "totalMaxBlobGasFee": 1630n,
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
