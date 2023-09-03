import { beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@blobscan/db";

import { filterData, getCaller } from "./helper";

describe("Stats route", async () => {
  let caller;

  beforeAll(async () => {
    caller = await getCaller();
  });

  describe("Blob", () => {
    describe("getOverallStats", () => {
      it("should get all", async () => {
        await prisma.blobOverallStats.backfill();
        const result = await caller.stats.blob.getOverallStats();
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
          caller.stats.blob.getDailyStats({
            timeFrame: "1d",
          }),
          caller.stats.blob.getDailyStats({
            timeFrame: "7d",
          }),
          caller.stats.blob.getDailyStats({
            timeFrame: "15d",
          }),
          caller.stats.blob.getDailyStats({
            timeFrame: "30d",
          }),
          caller.stats.blob.getDailyStats({
            timeFrame: "180d",
          }),
          caller.stats.blob.getDailyStats({
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
        const result = await caller.stats.block.getOverallStats();
        expect(filterData(result)).toMatchInlineSnapshot(`
          {
            "totalBlocks": 2,
          }
        `);
      });
    });

    describe("getDailyStats", () => {
      it("should get for every timeframe", async () => {
        await prisma.blockDailyStats.fill({});
        const result = await Promise.all([
          caller.stats.block.getDailyStats({
            timeFrame: "1d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "7d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "15d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "30d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "180d",
          }),
          caller.stats.block.getDailyStats({
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
        const result = await caller.stats.transaction.getOverallStats();
        expect(filterData(result)).toMatchInlineSnapshot(`
          {
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
          caller.stats.transaction.getDailyStats({
            timeFrame: "1d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "7d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "15d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "30d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "180d",
          }),
          caller.stats.block.getDailyStats({
            timeFrame: "360d",
          }),
        ]);
        expect(result).toMatchSnapshot();
      });
    });
  });
});
