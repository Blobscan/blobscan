import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import dayjs from "@blobscan/dayjs";
import { omitDBTimestampFields } from "@blobscan/test";

import { appRouter } from "../src/app-router";
import type { TimeFrame } from "../src/middlewares/withTimeFrame";
import { createTestContext } from "./helpers";

const TIME_FRAMES: TimeFrame[] = ["1d", "7d", "15d", "30d", "180d", "360d"];

function runTimeFrameTests({
  statsFiller,
  statsFetcher,
}: {
  statsFiller: () => Promise<unknown>;
  statsFetcher: (timeFrame: TimeFrame) => Promise<unknown>;
}) {
  return describe("when getting stats for a specific timeframe", () => {
    beforeEach(async () => {
      await statsFiller();
    });

    TIME_FRAMES.forEach((timeFrame) => {
      it(`should get daily stats for ${timeFrame}`, async () => {
        const result = await statsFetcher(timeFrame);

        expect(result).toMatchSnapshot();
      });
    });
  });
}

describe("Stats router", async () => {
  const systemDate = new Date("2023-09-01");
  const to = dayjs(systemDate).endOf("day").toISOString();
  let caller: ReturnType<typeof appRouter.createCaller>;
  let prisma: Awaited<ReturnType<typeof createTestContext>>["prisma"];

  beforeAll(async () => {
    const ctx = await createTestContext();

    prisma = ctx.prisma;
    caller = appRouter.createCaller(ctx);
  });

  beforeEach(async () => {
    await prisma.overallStats.aggregate();
  });

  describe("getOverallStats", () => {
    it("should return the correct overall stats", async () => {
      const overallStats = await caller.stats
        .getOverallStats()
        .then(omitDBTimestampFields);

      expect(overallStats).toMatchInlineSnapshot(`
        {
          "avgBlobAsCalldataFee": 22162.5,
          "avgBlobFee": 5160960,
          "avgBlobGasPrice": 21.75,
          "avgMaxBlobGasFee": 101.875,
          "totalBlobAsCalldataFee": "354600",
          "totalBlobAsCalldataGasUsed": "16300",
          "totalBlobFee": "82575360",
          "totalBlobGasUsed": "3801088",
          "totalBlobSize": "422116",
          "totalBlobs": 29,
          "totalBlocks": 8,
          "totalTransactions": 16,
          "totalUniqueBlobs": 9,
          "totalUniqueReceivers": 4,
          "totalUniqueSenders": 7,
        }
      `);
    });
  });

  describe("getBlobOverallStats", () => {
    it("should return the correct overall stats", async () => {
      const blobOverallStats = await caller.stats.getBlobOverallStats();

      expect(omitDBTimestampFields(blobOverallStats)).toMatchInlineSnapshot(`
        {
          "totalBlobSize": "422116",
          "totalBlobs": 29,
          "totalUniqueBlobs": 9,
        }
      `);
    });
  });

  describe("getBlobDailyStats", () => {
    runTimeFrameTests({
      statsFiller() {
        return prisma.blobDailyStats.populate({ to });
      },
      statsFetcher(timeFrame) {
        return caller.stats.getBlobDailyStats({ timeFrame });
      },
    });
  });

  describe("getBlockOverallStats", () => {
    it("should return the correct overall stats", async () => {
      const blockOverallStats = await caller.stats
        .getBlockOverallStats()
        .then(omitDBTimestampFields);

      expect(blockOverallStats).toMatchInlineSnapshot(`
        {
          "avgBlobAsCalldataFee": 22162.5,
          "avgBlobFee": 5160960,
          "avgBlobGasPrice": 21.75,
          "totalBlobAsCalldataFee": "354600",
          "totalBlobAsCalldataGasUsed": "16300",
          "totalBlobFee": "82575360",
          "totalBlobGasUsed": "3801088",
          "totalBlocks": 8,
        }
      `);
    });
  });

  describe("getBlockDailyStats", () => {
    runTimeFrameTests({
      statsFiller() {
        return prisma.blockDailyStats.populate({ to });
      },
      statsFetcher(timeFrame) {
        return caller.stats.getBlockDailyStats({ timeFrame });
      },
    });
  });

  describe("getTransactionOverallStats", () => {
    it("should return the correct overall stats", async () => {
      const result = await caller.stats
        .getTransactionOverallStats()
        .then(omitDBTimestampFields);

      expect(omitDBTimestampFields(result)).toMatchInlineSnapshot(`
        {
          "avgMaxBlobGasFee": 101.875,
          "totalTransactions": 16,
          "totalUniqueReceivers": 4,
          "totalUniqueSenders": 7,
        }
      `);
    });
  });

  describe("getTransactionDailyStats", () => {
    runTimeFrameTests({
      statsFiller() {
        return prisma.transactionDailyStats.populate({ to });
      },
      statsFetcher(timeFrame) {
        return caller.stats.getTransactionDailyStats({ timeFrame });
      },
    });
  });
});
