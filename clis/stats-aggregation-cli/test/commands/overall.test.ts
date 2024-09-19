import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { omitDBTimestampFields } from "@blobscan/test";

import { overall, overallCommandUsage } from "../../src/commands/overall";
import { runHelpArgTests } from "../helpers";

async function assertOverallStats() {
  const [blobOverallStats, blockOverallStats, transactionOverallStats] =
    await Promise.all([
      prisma.blobOverallStats
        .findMany()
        .then((stats) =>
          stats.map(({ id: _, ...rest }) => omitDBTimestampFields(rest))
        ),
      prisma.blockOverallStats
        .findMany()
        .then((stats) =>
          stats.map(({ id: _, ...rest }) => omitDBTimestampFields(rest))
        ),
      prisma.transactionOverallStats
        .findMany()
        .then((stats) =>
          stats.map(({ id: _, ...rest }) => omitDBTimestampFields(rest))
        ),
      ,
    ]);

  expect(blobOverallStats, "Blob overall stats mismatch").toMatchSnapshot();
  expect(blockOverallStats, "Block overall stats mismatch").toMatchSnapshot();
  expect(
    transactionOverallStats,
    "Transaction overall stats mismatch"
  ).toMatchSnapshot();
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
    it.only("should increment them until latest indexed block when target block 'latest' is provided", async () => {
      await overall(["--to", "latest"]);

      await assertOverallStats();
    });

    it("should increment them until latest finalized block", async () => {
      await overall(["--to", "finalized"]);

      await assertOverallStats();
    });

    it("should increment until provided block number", async () => {
      await overall(["--to", "1005"]);

      await assertOverallStats();
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
