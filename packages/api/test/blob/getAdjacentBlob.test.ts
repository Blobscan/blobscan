import { beforeAll, describe, expect, it } from "vitest";

import type { TRPCContext } from "../../src/context";
import type { AdjacentDirection } from "../../src/utils";
import { createTestContext } from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getAdjacentBlob", () => {
  let ctx: TRPCContext;
  let blobCaller: BlobCaller;

  beforeAll(async () => {
    ctx = await createTestContext();

    blobCaller = createBlobCaller(ctx);
  });

  async function getAdjacentPosition(
    txHash: string,
    index: number,
    direction: AdjacentDirection
  ) {
    const result = await blobCaller.getAdjacentBlob({
      txHash,
      index,
      direction,
    });

    return result
      ? {
          versionedHash: result.blob.versionedHash,
          txHash: result.txHash,
          index: result.index,
        }
      : null;
  }

  describe("when the blob is in the middle of its transaction", () => {
    it("should return the adjacent blobs in the same transaction", async () => {
      await expect(
        getAdjacentPosition("txHash001", 1, "prev")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash001",
        index: 0,
      });
      await expect(
        getAdjacentPosition("txHash001", 1, "next")
      ).resolves.toEqual({
        versionedHash: "blobHash003",
        txHash: "txHash001",
        index: 2,
      });
    });
  });

  describe("when the blob is the last blob of its transaction", () => {
    it("should return the first blob of the next transaction of the sender", async () => {
      await expect(
        getAdjacentPosition("txHash003", 1, "next")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash007",
        index: 0,
      });
    });

    it("should go to a transaction of the sender in a different block", async () => {
      await expect(
        getAdjacentPosition("txHash006", 2, "next")
      ).resolves.toEqual({
        versionedHash:
          "0xb100000000000000000000000000000000000000000000000000000000000000",
        txHash: "txHash016",
        index: 0,
      });
    });
  });

  describe("when the blob is the first blob of its transaction", () => {
    it("should return the last blob of the previous transaction of the sender", async () => {
      await expect(
        getAdjacentPosition("txHash007", 0, "prev")
      ).resolves.toEqual({
        versionedHash: "blobHash002",
        txHash: "txHash003",
        index: 1,
      });
    });
  });

  describe("when transactions of the sender have the same block timestamp", () => {
    it("should order them by their transaction index", async () => {
      await expect(
        getAdjacentPosition("txHash005", 2, "next")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash006",
        index: 0,
      });
      await expect(
        getAdjacentPosition("txHash006", 0, "prev")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash005",
        index: 2,
      });
    });
  });

  describe("when the blob is the first blob of the first transaction of the sender", () => {
    it("should return null for the previous blob", async () => {
      await expect(
        getAdjacentPosition("txHash003", 0, "prev")
      ).resolves.toBeNull();
    });
  });

  describe("when the blob is the last blob of the last transaction of the sender", () => {
    it("should return null for the next blob", async () => {
      await expect(
        getAdjacentPosition("txHash016", 0, "next")
      ).resolves.toBeNull();
    });
  });

  describe("when the next transaction of the sender is in a reorged block", () => {
    it("should ignore the reorged transaction", async () => {
      await expect(
        getAdjacentPosition("txHash015", 2, "next")
      ).resolves.toBeNull();
    });
  });

  describe("when the previous transaction of the sender is in a reorged block", () => {
    it("should ignore the reorged transaction", async () => {
      await ctx.prisma.transactionFork.create({
        data: { hash: "txHash012", blockHash: "blockHash005" },
      });

      await expect(
        getAdjacentPosition("txHash015", 0, "prev")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash007",
        index: 0,
      });
    });
  });

  describe("when the transaction of the blob is in a reorged block", () => {
    const reorgedTxHash =
      "0xd80214f2e7c7271114f372b6a8baaf39bcb364448788f6d8229d2a903edf9272";

    it("should return the last blob of the previous transaction of the sender", async () => {
      await expect(
        getAdjacentPosition(reorgedTxHash, 0, "prev")
      ).resolves.toEqual({
        versionedHash: "blobHash004",
        txHash: "txHash015",
        index: 2,
      });
    });

    it("should return null for the next blob", async () => {
      await expect(
        getAdjacentPosition(reorgedTxHash, 0, "next")
      ).resolves.toBeNull();
    });
  });

  describe("when the same blob is in a transaction more than one time", () => {
    it("should use the position to find the adjacent blobs", async () => {
      await expect(
        getAdjacentPosition("txHash005", 1, "prev")
      ).resolves.toEqual({
        versionedHash: "blobHash002",
        txHash: "txHash005",
        index: 0,
      });
      await expect(
        getAdjacentPosition("txHash005", 1, "next")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash005",
        index: 2,
      });
    });
  });

  describe("when an expand is given", () => {
    it("should return the blob in the same format as getByBlobId", async () => {
      const result = await blobCaller.getAdjacentBlob({
        txHash: "txHash001",
        index: 1,
        direction: "next",
        expand: "transaction",
      });
      const blob = await blobCaller.getByBlobId({
        id: "blobHash003",
        expand: "transaction",
      });

      expect(result?.blob).toEqual(blob);
    });
  });

  describe("when the blob position does not exist", () => {
    it("should throw a not found error", async () => {
      await expect(
        blobCaller.getAdjacentBlob({
          txHash: "txHash001",
          index: 99,
          direction: "next",
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });
});
