import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { omitDBTimestampFields } from "@blobscan/test";

import { overall, overallCommandUsage } from "../../src/commands/overall";
import { runHelpArgTests } from "../helpers";

vi.mock("../../src/env", () => ({
  env: {
    BEACON_NODE_ENDPOINT: "http://localhost:1234",
  },
}));

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

    describe("when target block 'finalized' is provided", () => {
      it("should increment them until latest finalized block", async () => {
        global.fetch = vi.fn().mockImplementation(() => ({
          json: vi.fn().mockImplementation(() => ({
            data: {
              message: {
                body: {
                  execution_payload: {
                    block_number: "1006",
                  },
                },
                slot: "106",
              },
            },
          })),
        }));

        await overall(["--to", "finalized"]);

        const overallStats = await getAllOverallStats().then((overallStats) =>
          overallStats.map((stats) => stats.map(omitDBTimestampFields))
        );

        expect(
          global.fetch,
          "Fetch should have been called with the correct endpoint"
        ).toHaveBeenCalledWith(
          `http://localhost:1234/eth/v2/beacon/blocks/finalized`
        );
        expect(overallStats).toMatchSnapshot();
      });

      it("should handle beacon node endpoint errors correctly", async () => {
        global.fetch = vi.fn().mockImplementation(() => {
          throw new Error("Some error from endpoint");
        });

        expect(overall(["--to", "finalized"])).rejects.toMatchInlineSnapshot(
          "[Error: Failed to fetch block from beacon node: Some error from endpoint]"
        );
      });
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
              "avgBlobSize": 1000,
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
      '[Error: Invalid `to` flag value: Expected a block number, "latest" or "finalized" but got: invalid-block-height]'
    );
  });
});
