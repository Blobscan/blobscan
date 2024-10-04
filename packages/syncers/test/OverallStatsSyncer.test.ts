import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { fixtures } from "@blobscan/test";

import { OverallStatsSyncer } from "../src/syncers/OverallStatsSyncer";
import type { OverallStatsSyncerConfig } from "../src/syncers/OverallStatsSyncer";

class OverallStatsUpdaterMock extends OverallStatsSyncer {
  constructor(config: Partial<OverallStatsSyncerConfig> = {}) {
    const lowestSlot =
      config.lowestSlot ?? fixtures.blockchainSyncState[0]?.lastLowerSyncedSlot;
    super({
      cronPattern: "* * * * *",
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

function getAllOverallStats() {
  return Promise.all([
    prisma.blobOverallStats.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          rollup: "asc",
        },
      ],
    }),
    prisma.blockOverallStats.findMany(),
    prisma.transactionOverallStats.findMany({
      orderBy: [
        {
          category: "asc",
        },
        {
          rollup: "asc",
        },
      ],
    }),
  ]).then((allOverallStats) =>
    allOverallStats.map((overallStats) =>
      overallStats.map(({ id: _, updatedAt: __, ...rest }) => rest)
    )
  );
}

function assertEmptyStats([
  blobOverallStats,
  blockOverallStats,
  txOverallStats,
]: Awaited<ReturnType<typeof getAllOverallStats>>) {
  expect(blobOverallStats, "Blob overall stats should be empty").toEqual([]);
  expect(blockOverallStats, "Block overall stats should be empty").toEqual([]);
  expect(txOverallStats, "Transaction overall stats should be empty").toEqual(
    []
  );
}

describe("OverallStatsUpdater", () => {
  let overallStatsUpdater: OverallStatsUpdaterMock;

  beforeEach(() => {
    overallStatsUpdater = new OverallStatsUpdaterMock();

    return async () => {
      await overallStatsUpdater.close();
    };
  });

  it("should aggregate all overall stats correctly", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    const incrementTransactionSpy = vi.spyOn(prisma, "$transaction");

    await workerProcessor();

    const [blobOverallStats, blockOverallStats, transactionOverallStats] =
      await getAllOverallStats();

    expect(
      incrementTransactionSpy,
      "Expect to aggregate overall stats within a transaction"
    ).toHaveBeenCalledOnce();
    expect(blobOverallStats, "Incorrect blob overall stats aggregation")
      .toMatchInlineSnapshot(`
        [
          {
            "category": "OTHER",
            "rollup": null,
            "totalBlobSize": 2500n,
            "totalBlobs": 2,
            "totalUniqueBlobs": 1,
          },
          {
            "category": "ROLLUP",
            "rollup": null,
            "totalBlobSize": 6900n,
            "totalBlobs": 6,
            "totalUniqueBlobs": 0,
          },
          {
            "category": null,
            "rollup": "OPTIMISM",
            "totalBlobSize": 6900n,
            "totalBlobs": 6,
            "totalUniqueBlobs": 0,
          },
          {
            "category": null,
            "rollup": null,
            "totalBlobSize": 9400n,
            "totalBlobs": 8,
            "totalUniqueBlobs": 1,
          },
        ]
      `);
    expect(blockOverallStats, "Incorrect block overall stats aggregation")
      .toMatchInlineSnapshot(`
        [
          {
            "avgBlobAsCalldataFee": 5406666.666666667,
            "avgBlobFee": 114000000,
            "avgBlobGasPrice": 21.33333333333333,
            "totalBlobAsCalldataFee": "16220000",
            "totalBlobAsCalldataGasUsed": "760000",
            "totalBlobFee": "342000000",
            "totalBlobGasPrice": "64",
            "totalBlobGasUsed": "16000000",
            "totalBlocks": 3,
          },
        ]
      `);
    expect(
      transactionOverallStats,
      "Incorrect transaction overall stats aggregation"
    ).toMatchInlineSnapshot(`
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
          "totalTransactions": 2,
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
          "totalTransactions": 2,
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
          "totalTransactions": 2,
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
          "totalTransactions": 4,
          "totalUniqueReceivers": 0,
          "totalUniqueSenders": 0,
        },
      ]
    `);
  });

  it("should aggregate overall stats in batches correctly when there are too many blocks", async () => {
    const batchSize = 2;
    const workerProcessor = new OverallStatsUpdaterMock({
      batchSize,
    }).getWorkerProcessor();
    const incrementTransactionSpy = vi.spyOn(prisma, "$transaction");
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

    const allOverallStats = await getAllOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when no blocks have been indexed yet", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    vi.spyOn(prisma.block, "findLatest").mockResolvedValueOnce(null);

    await workerProcessor();

    const allOverallStats = await getAllOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when the lowest slot hasn't been reached yet", async () => {
    const workerProcessor = new OverallStatsUpdaterMock({
      lowestSlot: 1,
    }).getWorkerProcessor();

    await workerProcessor();

    const allOverallStats = await getAllOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    assertEmptyStats(allOverallStats);
  });

  it("should skip aggregation when there is no new finalized blocks", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    await workerProcessor();

    const allOverallStats = await getAllOverallStats();

    await workerProcessor();

    const allOverallStatsAfter = await getAllOverallStats();

    expect(allOverallStats).toEqual(allOverallStatsAfter);
  });
});
