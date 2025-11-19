import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPrisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { OverallStatsSyncer } from "../src/syncers/OverallStatsSyncer";
import type { OverallStatsSyncerConfig } from "../src/syncers/OverallStatsSyncer";

const prisma = getPrisma();
class OverallStatsUpdaterMock extends OverallStatsSyncer {
  constructor(config: Partial<OverallStatsSyncerConfig> = {}) {
    const lowestSlot =
      config.lowestSlot ?? fixtures.blockchainSyncState[0]?.lastLowerSyncedSlot;
    super({
      cronPattern: "* * * * *",
      prisma,
      redisUriOrConnection: "redis://localhost:6379/1",
      ...config,
      lowestSlot,
    });
  }

  getWorker() {
    return this.worker;
  }

  getWorkerProcessor() {
    return this.syncerFn;
  }

  getQueue() {
    return this.queue;
  }
}

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

describe("OverallStatsUpdater", () => {
  let overallStatsUpdater: OverallStatsUpdaterMock;

  beforeEach(() => {
    overallStatsUpdater = new OverallStatsUpdaterMock();

    return async () => {
      await overallStatsUpdater.close();
    };
  });

  it("should aggregate overall stats correctly", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    await workerProcessor();

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
            "avgBlobUsageSize": 500,
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
            "totalBlobUsageSize": 1000n,
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
            "avgBlobUsageSize": 1150,
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
            "totalBlobUsageSize": 6900n,
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
            "avgBlobUsageSize": 1150,
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
            "totalBlobUsageSize": 6900n,
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
            "avgBlobUsageSize": 987.5,
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
            "totalBlobUsageSize": 7900n,
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
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();
    const expectedLastAggregatedBlock =
      fixtures.blockchainSyncState[0]?.lastFinalizedBlock;

    await workerProcessor();

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
    const workerProcessor = new OverallStatsUpdaterMock({
      batchSize,
    }).getWorkerProcessor();
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

    await workerProcessor();

    expect(
      incrementTransactionSpy,
      "Incorrect number of stats aggregation calls"
    ).toHaveBeenCalledTimes(batches);
  });

  it("should skip aggregation when no finalized block has been set", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    await prisma.blockchainSyncState.update({
      data: {
        lastFinalizedBlock: null,
      },
      where: {
        id: 1,
      },
    });

    await workerProcessor();

    const allOverallStats = await getOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when no blocks have been indexed yet", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    vi.spyOn(prisma.block, "findLatest").mockResolvedValueOnce(null);

    await workerProcessor();

    const allOverallStats = await getOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when the lowest slot hasn't been reached yet", async () => {
    const workerProcessor = new OverallStatsUpdaterMock({
      lowestSlot: 1,
    }).getWorkerProcessor();

    await workerProcessor();

    const allOverallStats = await getOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when there is no new finalized blocks", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    await workerProcessor();

    const allOverallStats = await getOverallStats();

    await workerProcessor();

    const allOverallStatsAfter = await getOverallStats();

    expect(allOverallStats).toEqual(allOverallStatsAfter);
  });
});
