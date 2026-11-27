import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src/context";
import { createTestContext } from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getByBlobId", () => {
  let ctx: TRPCContext;
  let blobCaller: BlobCaller;

  beforeAll(async () => {
    ctx = await createTestContext();
    blobCaller = createBlobCaller(ctx);
  });

  it("should get a blob by versioned hash", async () => {
    const result = await blobCaller.getByBlobId({
      id: "blobHash004",
    });

    expect(result).toMatchSnapshot();
  });

  it("should get a blob by kzg commitment", async () => {
    const result = await blobCaller.getByBlobId({
      id: "commitment004",
    });

    expect(result).toMatchSnapshot();
  });

  it("should fail when trying to get a blob by a non-existent hash", async () => {
    await expect(
      blobCaller.getByBlobId({
        id: "nonExistingHash",
      })
    ).rejects.toMatchSnapshot();
  });

  describe("when limiting the transactions", () => {
    const position = ({
      txHash,
      index,
    }: {
      txHash: string;
      index?: number | null;
    }) => `${txHash}:${index}`;

    it("should return a page of the transactions and the total count", async () => {
      const all = await blobCaller.getByBlobId({ id: "blobHash001" });
      const firstPage = await blobCaller.getByBlobId({
        id: "blobHash001",
        transactionsLimit: 5,
      });

      expect(all.transactionCount).toBe(12);
      expect(all.transactions).toHaveLength(12);
      expect(firstPage.transactionCount).toBe(12);
      expect(firstPage.transactions.map(position)).toEqual(
        all.transactions.slice(0, 5).map(position)
      );
    });

    it("should order the positions of one transaction by blob index", async () => {
      // blobHash004 is three times in txHash015.
      const { transactions } = await blobCaller.getByBlobId({
        id: "blobHash004",
        transactionsLimit: 2,
      });

      expect(transactions.map(position)).toEqual([
        "txHash015:0",
        "txHash015:1",
      ]);
    });

    it("should reject a limit above the maximum", async () => {
      await expect(
        blobCaller.getByBlobId({ id: "blobHash001", transactionsLimit: 1001 })
      ).rejects.toThrow();
    });
  });

  describe("when expanding the transactions", () => {
    const toMinute = (timestamp: Date) =>
      new Date(Math.floor(timestamp.getTime() / 60_000) * 60_000);

    async function createPricesForAllMinutesBut(skippedMinute: Date) {
      const { transactions } = await blobCaller.getByBlobId({
        id: "blobHash001",
      });
      const minutes = [
        ...new Set(
          transactions.map(({ blockTimestamp }) =>
            toMinute(new Date(blockTimestamp)).getTime()
          )
        ),
      ].filter((minute) => minute !== skippedMinute.getTime());
      const priceByMinute = new Map(
        minutes.map((minute, i) => [minute, 1000 + i])
      );

      await ctx.prisma.ethUsdPrice.createMany({
        data: minutes.map((minute) => ({
          timestamp: new Date(minute),
          price: priceByMinute.get(minute) ?? 0,
        })),
      });

      return priceByMinute;
    }

    it("should give each transaction the price of its own minute, also after a minute without a price", async () => {
      const { transactions } = await blobCaller.getByBlobId({
        id: "blobHash001",
      });
      // Skip the newest minute: before, every later transaction then got the
      // price of its neighbour.
      const newestMinute = toMinute(
        new Date(transactions[0]?.blockTimestamp ?? 0)
      );
      const priceByMinute = await createPricesForAllMinutesBut(newestMinute);

      const result = await blobCaller.getByBlobId({
        id: "blobHash001",
        expand: "transaction",
      });

      expect(
        result.transactions.map(({ ethUsdPrice }) => ethUsdPrice ?? null)
      ).toEqual(
        result.transactions.map(
          ({ blockTimestamp }) =>
            priceByMinute.get(toMinute(new Date(blockTimestamp)).getTime()) ??
            null
        )
      );
      expect(
        result.transactions.some(({ ethUsdPrice }) => ethUsdPrice == null)
      ).toBe(true);
    });

    it("should return the same prices when getting the blob by KZG commitment", async () => {
      await createPricesForAllMinutesBut(new Date(0));

      const byHash = await blobCaller.getByBlobId({
        id: "blobHash001",
        expand: "transaction",
      });
      const byCommitment = await blobCaller.getByBlobId({
        id: "commitment001",
        expand: "transaction",
      });

      expect(byHash.transactions.some(({ ethUsdPrice }) => ethUsdPrice)).toBe(
        true
      );
      expect(
        byCommitment.transactions.map(({ ethUsdPrice }) => ethUsdPrice)
      ).toEqual(byHash.transactions.map(({ ethUsdPrice }) => ethUsdPrice));
    });
  });
});
