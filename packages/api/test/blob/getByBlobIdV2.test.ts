import { beforeAll, describe, expect, it } from "vitest";

import { createTestContext } from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getByBlobIdV2", () => {
  let blobCaller: BlobCaller;

  beforeAll(async () => {
    blobCaller = createBlobCaller(await createTestContext());
  });

  it("should return the blob without its transactions, with their count", async () => {
    const result = await blobCaller.getByBlobIdV2({ id: "blobHash001" });

    expect(result).not.toHaveProperty("transactions");
    expect(result).toMatchSnapshot();
  });

  it("should return the same blob by KZG commitment", async () => {
    await expect(
      blobCaller.getByBlobIdV2({ id: "commitment001" })
    ).resolves.toEqual(await blobCaller.getByBlobIdV2({ id: "blobHash001" }));
  });

  it("should count the transactions that /v2/blobs/{id}/transactions lists", async () => {
    const { transactionCount } = await blobCaller.getByBlobIdV2({
      id: "blobHash001",
    });
    const { totalTransactions } = await blobCaller.getTransactionsByBlobId({
      id: "blobHash001",
      count: true,
    });

    expect(transactionCount).toBe(totalTransactions);
  });

  it("should fail when the blob does not exist", async () => {
    await expect(
      blobCaller.getByBlobIdV2({ id: "nonExistingHash" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
