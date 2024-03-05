import { beforeAll, describe, expect, it, vi } from "vitest";

import { PostgresStorage, env } from "../../src";
import { BlobStorageError } from "../../src/errors";
import { BLOB_HASH, HEX_DATA } from "../fixtures";

class PostgresStorageMock extends PostgresStorage {
  constructor() {
    super();
  }

  getClient() {
    return this.client;
  }
}

describe("PostgresStorage", () => {
  let storage: PostgresStorageMock;

  beforeAll(() => {
    storage = new PostgresStorageMock();
  });

  describe("healthCheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });
  });

  describe("storeBlob", () => {
    it("should store the blob data and return versionedHash", async () => {
      const result = await storage.storeBlob(env.CHAIN_ID, BLOB_HASH, HEX_DATA);

      expect(result).toBe(BLOB_HASH);
    });

    it("should throw a valid if the blob data has not been stored", async () => {
      const failingStorage = new PostgresStorageMock();

      vi.spyOn(
        failingStorage.getClient().blobData,
        "upsert"
      ).mockRejectedValueOnce(new Error("Failed to store blob data"));

      await expect(
        failingStorage.storeBlob(env.CHAIN_ID, BLOB_HASH, HEX_DATA)
      ).rejects.toThrowError(
        new BlobStorageError(
          "PostgresStorageMock",
          `Failed to store blob "${BLOB_HASH}"`,
          new Error("Failed to store blob data")
        )
      );
    });
  });

  describe("getBlob", () => {
    it("should fetch the blob data by a given versioned hash correctly", async () => {
      await storage.storeBlob(env.CHAIN_ID, BLOB_HASH, HEX_DATA);

      const result = await storage.getBlob(BLOB_HASH);

      expect(result).toBe(HEX_DATA);
    });

    it("should throw a valid error if no blob data has been found", async () => {
      const prisma = storage.getClient();

      vi.spyOn(prisma.blobData, "findFirstOrThrow").mockRejectedValueOnce(
        new Error("Blob data not found")
      );

      await expect(storage.getBlob(BLOB_HASH)).rejects.toThrowError(
        new BlobStorageError(
          "PostgresStorageMock",
          'Failed to get blob "0x0100eac880c712dba4346c88ab564fa1b79024106f78f732cca49d8a68e4c174"',
          new Error("Blob data not found")
        )
      );
    });
  });

  describe("tryGetConfigFromEnv", () => {
    it("should return undefined if POSTGRES_STORAGE_ENABLED is false", () => {
      const result = PostgresStorage.tryGetConfigFromEnv({
        POSTGRES_STORAGE_ENABLED: false,
      });
      expect(result).toBeUndefined();
    });

    it("should return an object if POSTGRES_STORAGE_ENABLED is true", () => {
      const result = PostgresStorage.tryGetConfigFromEnv({
        POSTGRES_STORAGE_ENABLED: true,
      });
      expect(result).toEqual({});
    });
  });
});
