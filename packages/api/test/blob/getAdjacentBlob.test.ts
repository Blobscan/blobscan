import { TRPCError } from "@trpc/server";
import { beforeAll, describe, expect, it } from "vitest";

import { createTestContext } from "../helpers";
import type { BlobCaller } from "./caller";
import { createBlobCaller } from "./caller";

describe("getAdjacentBlob", () => {
  let blobCaller: BlobCaller;

  beforeAll(async () => {
    const ctx = await createTestContext();

    blobCaller = createBlobCaller(ctx);
  });

  async function getAdjacentPosition(
    txHash: string,
    index: number,
    direction: "prev" | "next"
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
    it("should return the first blob of the next transaction of the block", async () => {
      await expect(
        getAdjacentPosition("txHash005", 2, "next")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash006",
        index: 0,
      });
    });
  });

  describe("when the blob is the first blob of its transaction", () => {
    it("should return the last blob of the previous transaction of the block", async () => {
      await expect(
        getAdjacentPosition("txHash006", 0, "prev")
      ).resolves.toEqual({
        versionedHash: "blobHash001",
        txHash: "txHash005",
        index: 2,
      });
    });
  });

  describe("when the blob is the first blob of the block", () => {
    it("should return null for the previous blob", async () => {
      await expect(
        getAdjacentPosition("txHash001", 0, "prev")
      ).resolves.toBeNull();
    });
  });

  describe("when the blob is the last blob of the block", () => {
    it("should return null for the next blob", async () => {
      await expect(
        getAdjacentPosition("txHash003", 1, "next")
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
      ).rejects.toThrow(TRPCError);
    });
  });
});
