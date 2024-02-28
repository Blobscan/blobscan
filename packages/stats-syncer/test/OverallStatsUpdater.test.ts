import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@blobscan/db";
import { omitDBTimestampFields } from "@blobscan/test";

import { OverallStatsUpdater } from "../src/updaters/OverallStatsUpdater";

class OverallStatsUpdaterMock extends OverallStatsUpdater {
  constructor(redisUri = process.env.REDIS_URI ?? "") {
    super(redisUri);
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

    await workerProcessor();

    const allOverallStats = await getAllOverallStats();
    expect(allOverallStats).toMatchSnapshot();
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
