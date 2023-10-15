import { beforeAll, describe, expect, it } from "vitest";

import dayjs from "@blobscan/dayjs";
import { omitDBTimestampFields } from "@blobscan/test";

import { appRouter } from "../src/app-router";
import type { TimeFrame } from "../src/middlewares/withTimeFrame";
import { getContext } from "./helpers";

const TIME_FRAMES: TimeFrame[] = ["1d", "7d", "15d", "30d", "180d", "360d"];

function runTimeFrameTests(
  name: string,
  statsFiller: () => Promise<unknown>,
  statsFetcher: (timeFrame: TimeFrame) => Promise<unknown>
) {
  return describe(name, () => {
    describe("when getting stats for a specific timeframe", () => {
      TIME_FRAMES.forEach((timeFrame) => {
        it(`should get daily stats for ${timeFrame}`, async () => {
          await statsFiller();

          const result = await statsFetcher(timeFrame);

          expect(result).toMatchSnapshot();
        });
      });
    });
  });
}

describe("Stats router", async () => {
  const systemDate = new Date("2023-09-01");
  const to = dayjs(systemDate).endOf("day").toISOString();
  let caller: ReturnType<typeof appRouter.createCaller>;
  let prisma: Awaited<ReturnType<typeof getContext>>["prisma"];

  beforeAll(async () => {
    const ctx = await getContext();

    prisma = ctx.prisma;
    caller = appRouter.createCaller(ctx);
  });

  describe("getBlobOverallStats", () => {
    it("should return the correct overall stats", async () => {
      await prisma.blobOverallStats.backfill();

      const blobOverallStats = await caller.stats.getBlobOverallStats();

      expect(omitDBTimestampFields(blobOverallStats)).toMatchInlineSnapshot(`
        {
          "avgBlobSize": 1137.5,
          "totalBlobSize": 36400n,
          "totalBlobs": 32,
          "totalUniqueBlobs": 7,
        }
      `);
    });
  });

  runTimeFrameTests(
    "getBlobDailyStats",
    async () => {
      await prisma.blobDailyStats.fill({
        to,
      });
    },

    (timeFrame) => caller.stats.getBlobDailyStats({ timeFrame })
  );

  describe("getBlockOverallStats", () => {
    it("should return the correct overall stats", async () => {
      await prisma.blockOverallStats.backfill();

      const blockOverallStats = await caller.stats.getBlockOverallStats();

      expect(omitDBTimestampFields(blockOverallStats)).toMatchInlineSnapshot(`
        {
          "avgBlobAsCalldataFee": 10450145,
          "avgBlobFee": 105412688,
          "avgBlobGasPrice": 21.75,
          "totalBlobAsCalldataFee": 83601160n,
          "totalBlobAsCalldataGasUsed": 3822780n,
          "totalBlobFee": 843301504n,
          "totalBlobGasUsed": 38786432n,
          "totalBlocks": 8,
        }
      `);
    });
  });

  runTimeFrameTests(
    "getBlockDailyStats",
    () =>
      prisma.blockDailyStats.fill({
        to,
      }),
    (timeFrame) => caller.stats.getBlockDailyStats({ timeFrame })
  );

  describe("getTransactionOverallStats", () => {
    it("should return the correct overall stats", async () => {
      await prisma.transactionOverallStats.backfill();
      const result = await caller.stats.getTransactionOverallStats();

      expect(omitDBTimestampFields(result)).toMatchInlineSnapshot(`
        {
          "avgMaxBlobGasFee": 101.875,
          "totalTransactions": 16,
          "totalUniqueReceivers": 4,
          "totalUniqueSenders": 4,
        }
      `);
    });
  });

  runTimeFrameTests(
    "getTransactionDailyStats",
    () => prisma.transactionDailyStats.fill({ to }),
    (timeFrame) => caller.stats.getTransactionDailyStats({ timeFrame })
  );
});
