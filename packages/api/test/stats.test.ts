import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@blobscan/db";

import { appRouter } from "../src/root";
import { filterData, getContext } from "./helper";

describe("Stats route", async () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const ctx = await getContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Blob", () => {
    describe("getOverallStats", () => {
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

    describe("getDailyStats", () => {
      it("should get for every timeframe", async () => {
        await prisma.blobDailyStats.fill({});
        const result = await Promise.all([
          caller.stats.getBlobDailyStats({
            timeFrame: "1d",
          }),
          caller.stats.getBlobDailyStats({
            timeFrame: "7d",
          }),
          caller.stats.getBlobDailyStats({
            timeFrame: "15d",
          }),
          caller.stats.getBlobDailyStats({
            timeFrame: "30d",
          }),
          caller.stats.getBlobDailyStats({
            timeFrame: "180d",
          }),
          caller.stats.getBlobDailyStats({
            timeFrame: "360d",
          }),
        ]);
        expect(result).toMatchSnapshot();
      });
    });
  });

  describe("Block", () => {
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

    describe("getDailyStats", () => {
      it("should get for every timeframe", async () => {
        await prisma.blockDailyStats.fill({});
        const result = await Promise.all([
          caller.stats.getBlockDailyStats({
            timeFrame: "1d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "7d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "15d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "30d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "180d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "360d",
          }),
        ]);
        expect(result).toMatchSnapshot();
      });
    });
  });

  describe("Transaction", () => {
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

    describe("getDailyStats", () => {
      it("should get for every timeframe", async () => {
        await prisma.transactionDailyStats.fill({});
        const result = await Promise.all([
          caller.stats.getTransactionDailyStats({
            timeFrame: "1d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "7d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "15d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "30d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "180d",
          }),
          caller.stats.getBlockDailyStats({
            timeFrame: "360d",
          }),
        ]);
        expect(result).toMatchSnapshot();
      });
    });
  });
});
