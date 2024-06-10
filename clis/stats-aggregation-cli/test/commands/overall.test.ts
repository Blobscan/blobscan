import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { omitDBTimestampFields } from "@blobscan/test";

import { overall, overallCommandUsage } from "../../src/commands/overall";
import { runHelpArgTests } from "../helpers";

function getAllOverallStats() {
  return Promise.all([
    prisma.blobOverallStats.findMany(),
    prisma.blockOverallStats.findMany(),
    prisma.transactionOverallStats.findMany(),
  ]);
}

describe("Overall command", () => {
  beforeAll(() => {
    // Silence console.log
    vi.spyOn(console, "log").mockImplementation(() => void {});
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  runHelpArgTests(overall, overallCommandUsage);

  describe("when incrementing overall stats", () => {
    it("should increment them until latest indexed block when target block 'latest' is provided", async () => {
      await overall(["--to", "latest"]);

      const overallStats = await getAllOverallStats().then((overallStats) =>
        overallStats.map((stats) => stats.map(omitDBTimestampFields))
      );

      expect(overallStats).toMatchSnapshot();
    });

    it("should increment them until latest finalized block", async () => {
      await overall(["--to", "finalized"]);

      const overallStats = await getAllOverallStats().then((overallStats) =>
        overallStats.map((stats) => stats.map(omitDBTimestampFields))
      );

      expect(overallStats).toMatchSnapshot();
    });

    it("should increment until provided block number", async () => {
      await overall(["--to", "1005"]);

      const overallStats = await getAllOverallStats().then((allOverallStats) =>
        allOverallStats.map((stats) => stats.map(omitDBTimestampFields))
      );

      expect(overallStats).toMatchInlineSnapshot(`
        [
          [
            {
              "id": 1,
              "totalBlobSize": 4000n,
              "totalBlobs": 4,
              "totalUniqueBlobs": 0,
            },
          ],
          [
            {
              "avgBlobAsCalldataFee": 5000000,
              "avgBlobFee": 100000000,
              "avgBlobGasPrice": 20,
              "id": 1,
              "totalBlobAsCalldataFee": "5000000",
              "totalBlobAsCalldataGasUsed": "250000",
              "totalBlobFee": "100000000",
              "totalBlobGasUsed": "5000000",
              "totalBlocks": 1,
            },
          ],
          [
            {
              "avgMaxBlobGasFee": 100,
              "id": 1,
              "totalTransactions": 2,
              "totalUniqueReceivers": 0,
              "totalUniqueSenders": 0,
            },
          ],
        ]
      `);
    });
  });

  it("should fail when an invalid target block height is given", async () => {
    expect(
      overall(["--to", "invalid-block-height"])
    ).rejects.toMatchInlineSnapshot(
      '[Error: Overall stats aggregation failed: Invalid `to` flag value. Expected a block number, "latest" or "finalized" but got invalid-block-height]'
    );
  });
});
