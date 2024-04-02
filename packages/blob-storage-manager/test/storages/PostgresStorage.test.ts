import { beforeAll, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

import { PostgresStorage, env } from "../../src";
import { BlobStorageError } from "../../src/errors";
import { NEW_BLOB_HASH, HEX_DATA } from "../fixtures";

class PostgresStorageMock extends PostgresStorage {
  constructor() {
    super({ chainId: env.CHAIN_ID });
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
    storage = new PostgresStorageMock();
  });

  describe("healthCheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });
  });

  describe("removeBlob", () => {
    it("should remove a blob", async () => {
      await storage.removeBlob(expectedStoredBlobHash);

      await expect(
        storage.getBlob(expectedStoredBlobUri)
      ).rejects.toThrowError();
    });

    testValidError(
      "should throw a valid error if trying to remove a non-existent blob",
      async () => {
        await storage.removeBlob("missing-blob");
      },
      BlobStorageError
    );
  });

  describe("storeBlob", () => {
    it("should store the blob data and return versionedHash", async () => {
      const result = await storage.storeBlob(NEW_BLOB_HASH, HEX_DATA);

      expect(result).toBe(NEW_BLOB_HASH);
    });

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

  describe("getBlob", () => {
    it("should fetch the blob data by a given versioned hash correctly", async () => {
      const result = await storage.getBlob(expectedStoredBlobUri);

      expect(result).toBe(expectedStoredBlobData);
    });

    testValidError(
      "should throw a valid error if no blob data has been found",
      async () => {
        const prisma = storage.getClient();

        vi.spyOn(prisma.blobData, "findFirstOrThrow").mockRejectedValueOnce(
          new Error("Blob data not found")
        );

        await storage.getBlob(expectedStoredBlobUri);
      },
      BlobStorageError,
      { checkCause: true }
    );
  });

  describe("tryGetConfigFromEnv", () => {
    it("should return a valid config object ", () => {
      expect(
        PostgresStorage.getConfigFromEnv({ CHAIN_ID: env.CHAIN_ID })
      ).toEqual({
        chainId: env.CHAIN_ID,
      });
    });
  });
});
