import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestContext } from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getAdjacentBlobs", () => {
  let blobCaller: BlobCaller;

  beforeAll(async () => {
    const ctx = await createTestContext();

    blobCaller = createBlobCaller(ctx);
  });

  it("should return the adjacent blobs within the same transaction", async () => {
    const result = await blobCaller.getAdjacentBlobs({
      txHash: "txHash001",
      index: 1,
    });

    expect(result).toEqual({
      prev: { versionedHash: "blobHash001", txHash: "txHash001", index: 0 },
      next: { versionedHash: "blobHash003", txHash: "txHash001", index: 2 },
    });
  });

  it("should move to the next transaction of the block when the blob is the last one of its transaction", async () => {
    const { next } = await blobCaller.getAdjacentBlobs({
      txHash: "txHash005",
      index: 2,
    });

    expect(next).toEqual({
      versionedHash: "blobHash001",
      txHash: "txHash006",
      index: 0,
    });
  });

  it("should move to the last blob of the previous transaction of the block when the blob is the first one of its transaction", async () => {
    const { prev } = await blobCaller.getAdjacentBlobs({
      txHash: "txHash006",
      index: 0,
    });

    expect(prev).toEqual({
      versionedHash: "blobHash001",
      txHash: "txHash005",
      index: 2,
    });
  });

  it("should not go beyond the first blob of the block", async () => {
    const { prev } = await blobCaller.getAdjacentBlobs({
      txHash: "txHash001",
      index: 0,
    });

    expect(prev).toBeUndefined();
  });

  it("should not go beyond the last blob of the block", async () => {
    const { next } = await blobCaller.getAdjacentBlobs({
      txHash: "txHash003",
      index: 1,
    });

    expect(next).toBeUndefined();
  });

  it("should distinguish the same blob included several times in a transaction", async () => {
    const result = await blobCaller.getAdjacentBlobs({
      txHash: "txHash005",
      index: 1,
    });

    expect(result).toEqual({
      prev: { versionedHash: "blobHash002", txHash: "txHash005", index: 0 },
      next: { versionedHash: "blobHash001", txHash: "txHash005", index: 2 },
    });
  });

  it("should fail when the blob position doesn't exist", async () => {
    await expect(
      blobCaller.getAdjacentBlobs({ txHash: "txHash001", index: 99 })
    ).rejects.toThrow(TRPCError);
  });
});
