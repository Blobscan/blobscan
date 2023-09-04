import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@blobscan/db";

import type { TimeFrame } from "../src/middlewares/withTimeFrame";
import { appRouter } from "../src/root";
import { filterData, getContext } from "./helper";

const TIME_FRAMES: TimeFrame[] = ["1d", "7d", "15d", "30d", "180d", "360d"];

function setUpGetDailyStatsTests(
  name: string,
  filler: () => Promise<unknown>,
  fetcher: (timeFrame: TimeFrame) => Promise<unknown>
) {
  return describe(name, () => {
    describe("when getting stats for a specific timeframe", () => {
      TIME_FRAMES.forEach((timeFrame) => {
        it(`should get daily stats for ${timeFrame}`, async () => {
          await filler();

          const result = await fetcher(timeFrame);

          expect(result).toMatchSnapshot();
        });
      });
    });
  });
}

describe("Stats route", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = await getContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("getBlobOverallStats", () => {
    it("should get all", async () => {
      await prisma.blobOverallStats.backfill();
      const result = await caller.stats.getBlobOverallStats();
      expect(filterData(result)).toMatchInlineSnapshot(`
          {
            "avgBlobSize": 1250,
            "totalBlobSize": 7500n,
            "totalBlobs": 6,
            "totalUniqueBlobs": 6,
          }
        `);
    });
  });

  setUpGetDailyStatsTests(
    "getBlobDailyStats",
    () => prisma.blobDailyStats.fill({}),
    (timeFrame) => caller.stats.getBlobDailyStats({ timeFrame })
  );

  describe("getOverallStats", () => {
    it("should get all", async () => {
      await prisma.blockOverallStats.backfill();
      const result = await caller.stats.getBlockOverallStats();
      expect(filterData(result)).toMatchInlineSnapshot(`
          {
            "avgBlobAsCalldataFee": 5305000,
            "avgBlobFee": 110500000,
            "avgBlobGasPrice": 21,
            "totalBlobAsCalldataFee": 10610000n,
            "totalBlobAsCalldataGasUsed": 505000n,
            "totalBlobFee": 221000000n,
            "totalBlobGasUsed": 10500000n,
            "totalBlocks": 2,
          }
        `);
    });
  });

  setUpGetDailyStatsTests(
    "getBlockDailyStats",
    () => prisma.blockDailyStats.fill({}),
    (timeFrame) => caller.stats.getBlockDailyStats({ timeFrame })
  );

  describe("getOverallStats", () => {
    it("should get all", async () => {
      await prisma.transactionOverallStats.backfill();
      const result = await caller.stats.getTransactionOverallStats();
      expect(filterData(result)).toMatchInlineSnapshot(`
          {
            "avgMaxBlobGasFee": 105,
            "totalTransactions": 6,
            "totalUniqueReceivers": 4,
            "totalUniqueSenders": 4,
          }
        `);
    });
  });

  setUpGetDailyStatsTests(
    "getTransactionDailyStats",
    () => prisma.transactionDailyStats.fill({}),
    (timeFrame) => caller.stats.getTransactionDailyStats({ timeFrame })
  );
});
