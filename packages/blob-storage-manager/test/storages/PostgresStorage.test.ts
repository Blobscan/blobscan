import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import type { BlobscanPrismaClient, PrismaClient } from "@blobscan/db";
import { prisma } from "@blobscan/db";
import { env } from "@blobscan/env";
import { testValidError } from "@blobscan/test";

import { PostgresStorage } from "../../src";
import { BlobStorageError } from "../../src/errors";
import { bytesToHex } from "../../src/utils";
import { NEW_BLOB_HASH, HEX_DATA } from "../fixtures";

class PostgresStorageMock extends PostgresStorage {
  constructor(prisma?: PrismaClient | BlobscanPrismaClient) {
    super({ chainId: env.CHAIN_ID, prisma });
  }

  healthCheck() {
    return super.healthCheck();
  }

  getClient() {
    return this.client;
  }
}

describe("PostgresStorage", () => {
  let storage: PostgresStorageMock;
  const expectedStoredBlobHash = "blobHash004";
  const expectedStoredBlobUri = expectedStoredBlobHash;
  const expectedStoredBlobData = "0x4fe40fc67f9c3a3ffa2be77d10fe7818";

  beforeAll(() => {
    storage = new PostgresStorageMock(prisma);
  });

  afterEach(async () => {
    await prisma.blobData.deleteMany();
  });

  it("should create a storage", async () => {
    const storage_ = await PostgresStorage.create({
      chainId: env.CHAIN_ID,
    });

    expect(storage_.chainId, "Chain ID mismatch").toBe(env.CHAIN_ID);
  });

  it("should create a storage with a provided prisma client", async () => {
    const storage_ = new PostgresStorageMock(prisma);

    expect(storage_.getClient()).toEqual(prisma);
  });

  it("should return the correct uri given a blob hash", () => {
    const blobUri = storage.getBlobUri(NEW_BLOB_HASH);

    expect(blobUri).toBe(NEW_BLOB_HASH);
  });

  it("should return 'OK' if storage is healthy", async () => {
    await expect(storage.healthCheck()).resolves.toBe("OK");
  });

  it("should get a blob given its reference", async () => {
    const result = await storage.getBlob(expectedStoredBlobUri);

    expect(result).toBe(expectedStoredBlobData);
  });

  it("should remove a blob given its reference", async () => {
    await storage.removeBlob(expectedStoredBlobHash);

    await expect(storage.getBlob(expectedStoredBlobUri)).rejects.toThrowError();
  });

  it("should not throw an error when trying to remove a non-existent blob", async () => {
    await expect(
      storage.removeBlob("non-existent-blob-uri")
    ).resolves.not.toThrow();
  });

  it("should store a blob", async () => {
    const blobReference = await storage.storeBlob(NEW_BLOB_HASH, HEX_DATA);

    const res = await prisma.blobData.findUnique({
      where: {
        id: blobReference,
      },
    });

    expect(res?.data ? bytesToHex(res?.data) : "").toBe(HEX_DATA);
  });

  it("should return an uri when storing a blob", async () => {
    const result = await storage.storeBlob(NEW_BLOB_HASH, HEX_DATA);

    expect(result).toBe(NEW_BLOB_HASH);
  });

  testValidError(
    "should throw a valid error when trying to get a non-existent blob",
    async () => {
      const prisma = storage.getClient();

      vi.spyOn(prisma.blobData, "findUniqueOrThrow").mockRejectedValueOnce(
        new Error("Blob data not found")
      );

      await storage.getBlob(expectedStoredBlobUri);
    },
    BlobStorageError,
    { checkCause: true }
  );

  testValidError(
    "should throw a valid if the blob data has not been stored",
    async () => {
      const failingStorage = new PostgresStorageMock();

      vi.spyOn(
        failingStorage.getClient().blobData,
        "upsert"
      ).mockRejectedValueOnce(new Error("Failed to store blob data"));

      await failingStorage.storeBlob(NEW_BLOB_HASH, HEX_DATA);
    },
    BlobStorageError,
    {
      checkCause: true,
    }
  );
});
