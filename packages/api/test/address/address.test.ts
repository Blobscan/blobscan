import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src";
import { createTestContext } from "../helpers";
import { aggregateAddressMetrics, aggregateMetrics } from "../metrics";
import { createTransactionCaller } from "../tx/caller";
import type { TxCaller } from "../tx/caller";
import { createAddressCaller } from "./caller";
import type { AddressCaller } from "./caller";

// address2 sends and receives blob transactions. address4 only receives.
const BOTH_ROLES = "address2";
const RECEIVER_ONLY = "address4";

type CanonicalTx = {
  hash: string;
  fromId: string;
  toId: string;
  blockTimestamp: Date;
  index: number;
};

function canonicalTxs(ctx: TRPCContext, address: string) {
  return ctx.prisma.$queryRawUnsafe<CanonicalTx[]>(
    `SELECT hash, from_id AS "fromId", to_id AS "toId",
       block_timestamp AS "blockTimestamp", index
     FROM transaction t
     WHERE (from_id = $1 OR to_id = $1)
       AND NOT EXISTS (
         SELECT 1 FROM transaction_fork f
         WHERE f.hash = t.hash AND f.block_hash = t.block_hash
       )
     ORDER BY block_timestamp, index`,
    address
  );
}

describe("address router", () => {
  let caller: AddressCaller;
  let txCaller: TxCaller;
  let ctx: TRPCContext;

  beforeAll(async () => {
    ctx = await createTestContext();
    caller = createAddressCaller(ctx);
    txCaller = createTransactionCaller(ctx);
  });

  beforeEach(async () => {
    await aggregateMetrics(ctx.prisma);
    await aggregateAddressMetrics(ctx.prisma);
  });

  describe("getOverall", () => {
    it("should return the totals of each role for all the time", async () => {
      const txs = await canonicalTxs(ctx, BOTH_ROLES);
      const sent = txs.filter((tx) => tx.fromId === BOTH_ROLES);
      const received = txs.filter((tx) => tx.toId === BOTH_ROLES);

      const { data } = await caller.getOverall({ address: BOTH_ROLES });

      expect(sent.length).toBeGreaterThan(0);
      expect(received.length).toBeGreaterThan(0);
      expect(data.timeFrame).toBe("All");
      expect(data.sent.totalTransactions).toBe(sent.length);
      expect(data.received.totalTransactions).toBe(received.length);
      expect(data.selfTotalTransactions).toBe(0);
      expect(data.allTime.totalTransactions).toBe(txs.length);
    });

    it("should return the first and the last transaction in either role", async () => {
      const txs = await canonicalTxs(ctx, BOTH_ROLES);

      const { data } = await caller.getOverall({ address: BOTH_ROLES });

      expect(data.allTime.firstTransaction).toEqual({
        hash: txs[0]?.hash,
        blockTimestamp: txs[0]?.blockTimestamp,
      });
      expect(data.allTime.lastTransaction).toEqual({
        hash: txs.at(-1)?.hash,
        blockTimestamp: txs.at(-1)?.blockTimestamp,
      });
    });

    it("should count the active days in either role", async () => {
      const txs = await canonicalTxs(ctx, BOTH_ROLES);
      const days = new Set(
        txs.map((tx) => tx.blockTimestamp.toISOString().slice(0, 10))
      );

      const { data } = await caller.getOverall({ address: BOTH_ROLES });

      expect(data.allTime.activeDays).toBe(days.size);
    });

    it("should match a checksummed address", async () => {
      const { data } = await caller.getOverall({
        address: RECEIVER_ONLY.toUpperCase(),
      });

      expect(data.address).toBe(RECEIVER_ONLY);
      expect(data.received.totalTransactions).toBeGreaterThan(0);
      expect(data.sent.totalTransactions).toBe(0);
      expect(data.sent.totalBlobBaseFeeUsd).toBeNull();
    });

    it("should add the daily rows after aggregatedUntil", async () => {
      const before = await caller.getOverall({ address: BOTH_ROLES });

      // An all-time row from an older run, which does not have the days
      // after aggregatedUntil yet.
      await ctx.prisma.addressAllTimeMetrics.update({
        where: { address: BOTH_ROLES },
        data: {
          aggregatedUntil: new Date("2000-01-01"),
          sentTotalTransactions: 0,
          receivedTotalTransactions: 0,
        },
      });

      const after = await caller.getOverall({ address: BOTH_ROLES });

      expect(after.data.sent.totalTransactions).toBe(
        before.data.sent.totalTransactions
      );
      expect(after.data.received.totalTransactions).toBe(
        before.data.received.totalTransactions
      );
    });

    it("should return the totals of a time frame", async () => {
      const { data: all } = await caller.getOverall({ address: BOTH_ROLES });
      const { data: lastDay } = await caller.getOverall({
        address: BOTH_ROLES,
        timeFrame: "1d",
      });

      expect(lastDay.timeFrame).toBe("1d");
      expect(lastDay.sent.totalTransactions).toBeLessThanOrEqual(
        all.sent.totalTransactions
      );
      expect(lastDay.network.totalBlobs).toBeLessThanOrEqual(
        all.network.totalBlobs
      );
    });

    it("should return zero values for an unknown address", async () => {
      const { data } = await caller.getOverall({
        address: "0x0000000000000000000000000000000000000001",
      });

      expect(data.sent.totalTransactions).toBe(0);
      expect(data.received.totalTransactions).toBe(0);
      expect(data.allTime.firstTransaction).toBeNull();
      expect(data.allTime.activeDays).toBe(0);
    });
  });

  describe("getTimeseries", () => {
    it("should return one value of each role for each day, with no gaps", async () => {
      const txs = await canonicalTxs(ctx, BOTH_ROLES);

      const { data } = await caller.getTimeseries({ address: BOTH_ROLES });

      expect(data.granularity).toBe("day");
      expect(data.timestamps[0]?.toISOString().slice(0, 10)).toBe(
        txs[0]?.blockTimestamp.toISOString().slice(0, 10)
      );

      for (let i = 1; i < data.timestamps.length; i++) {
        const prev = data.timestamps[i - 1] as Date;
        const curr = data.timestamps[i] as Date;
        expect(curr.getTime() - prev.getTime()).toBe(24 * 60 * 60 * 1000);
      }

      for (const series of [data.sent, data.received]) {
        expect(series.totalTransactions).toHaveLength(data.timestamps.length);
      }
      expect(data.network.totalBlobs).toHaveLength(data.timestamps.length);

      const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
      expect(sum(data.sent.totalTransactions)).toBe(
        txs.filter((tx) => tx.fromId === BOTH_ROLES).length
      );
      expect(sum(data.received.totalTransactions)).toBe(
        txs.filter((tx) => tx.toId === BOTH_ROLES).length
      );
    });

    it("should use hours for the 1d and 7d time frames", async () => {
      const { data } = await caller.getTimeseries({
        address: BOTH_ROLES,
        timeFrame: "7d",
      });

      expect(data.granularity).toBe("hour");
      expect(data.timestamps).toHaveLength(7 * 24 + 1);
    });
  });

  describe("tx.getAll address filter", () => {
    it("should return the transactions in either role", async () => {
      const txs = await canonicalTxs(ctx, BOTH_ROLES);

      const { transactions } = await txCaller.getAll({
        address: BOTH_ROLES,
        ps: 100,
      });

      expect(transactions.map((tx) => tx.hash).sort()).toEqual(
        txs.map((tx) => tx.hash).sort()
      );
    });

    it("should count the transactions in either role", async () => {
      const txs = await canonicalTxs(ctx, BOTH_ROLES);

      const { totalTransactions } = await txCaller.getAll({
        address: BOTH_ROLES,
        count: true,
      });

      expect(totalTransactions).toBe(txs.length);
    });
  });
});
