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

  describe("getBlobOverallStats", () => {
    it("should return the correct overall stats", async () => {
      await prisma.blobOverallStats.populate();

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
      await prisma.blockOverallStats.populate();

      const blockOverallStats = await caller.stats.getBlockOverallStats();

      expect(omitDBTimestampFields(blockOverallStats)).toMatchInlineSnapshot(`
        {
          "avgBlobAsCalldataFee": 10450145,
          "avgBlobFee": 105412688,
          "avgBlobGasPrice": 21.75,
          "totalBlobAsCalldataFee": "83601160",
          "totalBlobAsCalldataGasUsed": "3822780",
          "totalBlobFee": "843301504",
          "totalBlobGasUsed": "38786432",
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
      await prisma.transactionOverallStats.populate();
      const result = await caller.stats.getTransactionOverallStats();

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
