import { beforeAll, describe, expect, it } from "vitest";

import { createTestContext } from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

const position = ({
  txHash,
  index,
}: {
  txHash: string;
  index?: number | null;
}) => `${txHash}:${index}`;

describe("getTransactionsByBlobId", () => {
  let blobCaller: BlobCaller;

  beforeAll(async () => {
    blobCaller = createBlobCaller(await createTestContext());
  });

  it("should return the transactions of the blob without repeating the blob", async () => {
    const { transactions } = await blobCaller.getTransactionsByBlobId({
      id: "blobHash001",
      ps: 100,
    });

    expect(transactions.length).toBeGreaterThan(1);

    for (const transaction of transactions) {
      expect(transaction).not.toHaveProperty("versionedHash");
      expect(transaction).not.toHaveProperty("commitment");
      expect(transaction).not.toHaveProperty("dataStorageReferences");
    }
  });

  it("should page through every transaction once and count them", async () => {
    const { transactions: all, totalTransactions } =
      await blobCaller.getTransactionsByBlobId({
        id: "blobHash001",
        ps: 100,
        count: true,
      });
    const paged: string[] = [];
    let cursor: string | undefined;

    do {
      const page = await blobCaller.getTransactionsByBlobId({
        id: "blobHash001",
        ps: 5,
        cursor,
      });

      paged.push(...page.transactions.map(position));
      cursor = page.pagination.nextCursor ?? undefined;
    } while (cursor);

    expect(totalTransactions).toBe(all.length);
    expect(paged).toEqual(all.map(position));
  });

  it("should return the same transactions by KZG commitment", async () => {
    await expect(
      blobCaller.getTransactionsByBlobId({ id: "commitment001", ps: 100 })
    ).resolves.toEqual(
      await blobCaller.getTransactionsByBlobId({ id: "blobHash001", ps: 100 })
    );
  });

  it("should return the transactions in the format of getByBlobId", async () => {
    const byPosition = (a: { txHash: string }, b: { txHash: string }) =>
      position(a).localeCompare(position(b));
    const { transactions } = await blobCaller.getTransactionsByBlobId({
      id: "blobHash001",
      ps: 100,
      expand: "transaction",
      type: "canonical",
    });
    const legacy = await blobCaller.getByBlobId({
      id: "blobHash001",
      expand: "transaction",
    });
    const canonical = new Set(transactions.map(position));

    expect([...transactions].sort(byPosition)).toEqual(
      legacy.transactions
        .filter((transaction) => canonical.has(position(transaction)))
        .sort(byPosition)
    );
  });

  it("should fail when the blob does not exist", async () => {
    await expect(
      blobCaller.getTransactionsByBlobId({ id: "nonExistingHash" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
