import { beforeEach, describe, expect, it, vi } from "vitest";

import { prisma } from "@blobscan/db";
import { fixtures, omitDBTimestampFields } from "@blobscan/test";

import { OverallStatsUpdater } from "../src/updaters/OverallStatsUpdater";

class OverallStatsUpdaterMock extends OverallStatsUpdater {
  constructor(
    redisUri = process.env.REDIS_URI ?? "",
    config?: ConstructorParameters<typeof OverallStatsUpdater>[1]
  ) {
    super(redisUri, config);
  }

  getWorker() {
    return this.worker;
  }

  getWorkerProcessor() {
    return this.updaterFn;
  }

  getQueue() {
    return this.queue;
  }
}

function getAllOverallStats() {
  const uniqueArgs = {
    where: {
      id: 1,
    },
  };

  return Promise.all([
    prisma.blobOverallStats.findUnique(uniqueArgs),
    prisma.blockOverallStats.findUnique(uniqueArgs),
    prisma.transactionOverallStats.findUnique(uniqueArgs),
  ]).then((allOverallStats) =>
    allOverallStats.map((stats) =>
      stats ? omitDBTimestampFields(stats) : undefined
    )
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
        {
          "avgBlobSize": 1175,
          "id": 1,
          "totalBlobSize": 9400n,
          "totalBlobs": 8,
          "totalUniqueBlobs": 1,
        }
      `);
    expect(blockOverallStats, "Incorrect block overall stats aggregation")
      .toMatchInlineSnapshot(`
        {
          "avgBlobAsCalldataFee": 5406666.666666667,
          "avgBlobFee": 114000000,
          "avgBlobGasPrice": 21.33333333333333,
          "id": 1,
          "totalBlobAsCalldataFee": "16220000",
          "totalBlobAsCalldataGasUsed": "760000",
          "totalBlobFee": "342000000",
          "totalBlobGasUsed": "16000000",
          "totalBlocks": 3,
        }
      `);
    expect(
      transactionOverallStats,
      "Incorrect transaction overall stats aggregation"
    ).toMatchInlineSnapshot(`
      {
        "avgMaxBlobGasFee": 100,
        "id": 1,
        "totalTransactions": 4,
        "totalUniqueReceivers": 0,
        "totalUniqueSenders": 0,
      }
    `);
  });

  it("should aggregate overall stats in batches correctly when there are too many blocks", async () => {
    const batchSize = 2;
    const workerProcessor = new OverallStatsUpdaterMock(undefined, {
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

  it("should skip aggregation when no blocks have been indexed yet", async () => {
    const workerProcessor = overallStatsUpdater.getWorkerProcessor();

    await prisma.blockchainSyncState.deleteMany({});

    await workerProcessor();

    const allOverallStats = await getAllOverallStats().then((allOverallStats) =>
      allOverallStats.filter((stats) => !!stats)
    );

    expect(allOverallStats).toEqual([]);
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
