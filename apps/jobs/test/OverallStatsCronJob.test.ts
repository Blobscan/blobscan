import { describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import workerProcessor from "../src/cron-jobs/overall-stats/processor";
import type { OverallStatsJob } from "../src/cron-jobs/overall-stats/types";

const FORK_SLOT = fixtures.blockchainSyncState[0]?.lastLowerSyncedSlot ?? 106;

function getOverallStats() {
  return prisma.overallStats
    .findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          rollup: "asc",
        },
      ],
    })
    .then((multipleOverallStats) =>
      multipleOverallStats.map(
        ({ id: _, updatedAt: __, ...overallStats }) => overallStats
      )
    );
}

function assertEmptyStats(
  overallStats: Awaited<ReturnType<typeof getOverallStats>>
) {
  expect(overallStats, "Overall stats should be empty").toEqual([]);
}

describe("OverallStatsCronjob", () => {
  const job = {
    data: {
      forkSlot: FORK_SLOT,
    },
  } as OverallStatsJob;

  it("should aggregate overall stats correctly", async () => {
    await workerProcessor(job);

    const overallStats = await getOverallStats();

    expect(overallStats, "Incorrect overall stats aggregation")
      .toMatchInlineSnapshot(`
        [
          {
            "avgBlobAsCalldataFee": 21000,
            "avgBlobAsCalldataMaxFee": 100000,
            "avgBlobFee": 2752512,
            "avgBlobGasPrice": 21,
            "avgBlobMaxFee": 13107200,
            "avgMaxBlobGasFee": 100,
            "category": "OTHER",
            "rollup": null,
            "totalBlobAsCalldataFee": "42000",
            "totalBlobAsCalldataGasUsed": "2000",
            "totalBlobAsCalldataMaxFees": "200000",
            "totalBlobFee": "5505024",
            "totalBlobGasPrice": "42",
            "totalBlobGasUsed": "262144",
            "totalBlobMaxFees": "26214400",
            "totalBlobMaxGasFees": "200",
            "totalBlobSize": 2500n,
            "totalBlobs": 2,
            "totalBlocks": 2,
            "totalTransactions": 2,
            "totalUniqueBlobs": 0,
            "totalUniqueReceivers": 0,
            "totalUniqueSenders": 0,
          },
          {
            "avgBlobAsCalldataFee": 21000,
            "avgBlobAsCalldataMaxFee": 100000,
            "avgBlobFee": 8257536,
            "avgBlobGasPrice": 21,
            "avgBlobMaxFee": 39321600,
            "avgMaxBlobGasFee": 100,
            "category": "ROLLUP",
            "rollup": null,
            "totalBlobAsCalldataFee": "42000",
            "totalBlobAsCalldataGasUsed": "2000",
            "totalBlobAsCalldataMaxFees": "200000",
            "totalBlobFee": "16515072",
            "totalBlobGasPrice": "42",
            "totalBlobGasUsed": "786432",
            "totalBlobMaxFees": "78643200",
            "totalBlobMaxGasFees": "200",
            "totalBlobSize": 6900n,
            "totalBlobs": 6,
            "totalBlocks": 2,
            "totalTransactions": 2,
            "totalUniqueBlobs": 1,
            "totalUniqueReceivers": 0,
            "totalUniqueSenders": 0,
          },
          {
            "avgBlobAsCalldataFee": 21000,
            "avgBlobAsCalldataMaxFee": 100000,
            "avgBlobFee": 8257536,
            "avgBlobGasPrice": 21,
            "avgBlobMaxFee": 39321600,
            "avgMaxBlobGasFee": 100,
            "category": null,
            "rollup": "OPTIMISM",
            "totalBlobAsCalldataFee": "42000",
            "totalBlobAsCalldataGasUsed": "2000",
            "totalBlobAsCalldataMaxFees": "200000",
            "totalBlobFee": "16515072",
            "totalBlobGasPrice": "42",
            "totalBlobGasUsed": "786432",
            "totalBlobMaxFees": "78643200",
            "totalBlobMaxGasFees": "200",
            "totalBlobSize": 6900n,
            "totalBlobs": 6,
            "totalBlocks": 2,
            "totalTransactions": 2,
            "totalUniqueBlobs": 1,
            "totalUniqueReceivers": 0,
            "totalUniqueSenders": 0,
          },
          {
            "avgBlobAsCalldataFee": 21000,
            "avgBlobAsCalldataMaxFee": 100000,
            "avgBlobFee": 5505024,
            "avgBlobGasPrice": 21,
            "avgBlobMaxFee": 26214400,
            "avgMaxBlobGasFee": 100,
            "category": null,
            "rollup": null,
            "totalBlobAsCalldataFee": "84000",
            "totalBlobAsCalldataGasUsed": "4000",
            "totalBlobAsCalldataMaxFees": "400000",
            "totalBlobFee": "22020096",
            "totalBlobGasPrice": "84",
            "totalBlobGasUsed": "1048576",
            "totalBlobMaxFees": "104857600",
            "totalBlobMaxGasFees": "400",
            "totalBlobSize": 9400n,
            "totalBlobs": 8,
            "totalBlocks": 3,
            "totalTransactions": 4,
            "totalUniqueBlobs": 1,
            "totalUniqueReceivers": 0,
            "totalUniqueSenders": 0,
          },
        ]
      `);
  });

  it("should update last aggregated block to last finalized block after aggregation", async () => {
    const expectedLastAggregatedBlock =
      fixtures.blockchainSyncState[0]?.lastFinalizedBlock;

    await workerProcessor(job);

    const lastAggregatedBlock = await prisma.blockchainSyncState
      .findUnique({
        select: {
          lastAggregatedBlock: true,
        },
        where: {
          id: 1,
        },
      })
      .then((state) => state?.lastAggregatedBlock);

    expect(lastAggregatedBlock).toBe(expectedLastAggregatedBlock);
  });

  it("should aggregate overall stats in batches correctly when there are too many blocks", async () => {
    const batchSize = 2;

    const incrementTransactionSpy = vi.spyOn(prisma.overallStats, "aggregate");
    const blockchainSyncState = fixtures.blockchainSyncState[0];
    const lastAggregatedBlock = blockchainSyncState
      ? blockchainSyncState.lastAggregatedBlock + 1
      : 0;
    const lastFinalizedBlock =
      fixtures.blockchainSyncState[0]?.lastFinalizedBlock ?? 0;
    const batches = Math.ceil(
      (lastFinalizedBlock - lastAggregatedBlock + 1) / batchSize
    );

    await workerProcessor({
      data: {
        batchSize,
        forkSlot: FORK_SLOT,
      },
    } as OverallStatsJob);

    expect(
      incrementTransactionSpy,
      "Incorrect number of stats aggregation calls"
    ).toHaveBeenCalledTimes(batches);
  });

  it("should skip aggregation when no finalized block has been set", async () => {
    await prisma.blockchainSyncState.update({
      data: {
        lastFinalizedBlock: null,
      },
      where: {
        id: 1,
      },
    });

    await workerProcessor(job);

    const allOverallStats = await getOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when no blocks have been indexed yet", async () => {
    vi.spyOn(prisma.block, "findLatest").mockResolvedValueOnce(null);

    await workerProcessor(job);

    const allOverallStats = await getOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when the lowest slot hasn't been reached yet", async () => {
    await workerProcessor({
      data: {
        forkSlot: 1,
      },
    } as OverallStatsJob);

    const allOverallStats = await getOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when there is no new finalized blocks", async () => {
    await workerProcessor(job);

    const allOverallStats = await getOverallStats();

    await workerProcessor(job);

    const allOverallStatsAfter = await getOverallStats();

    expect(allOverallStats).toEqual(allOverallStatsAfter);
  });
});
