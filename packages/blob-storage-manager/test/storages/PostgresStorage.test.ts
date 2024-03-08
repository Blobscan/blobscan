import { beforeAll, describe, expect, it, vi } from "vitest";

import { testValidError } from "@blobscan/test";

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

    testValidError(
      "should throw a valid if the blob data has not been stored",
      async () => {
        const failingStorage = new PostgresStorageMock();

        vi.spyOn(
          failingStorage.getClient().blobData,
          "upsert"
        ).mockRejectedValueOnce(new Error("Failed to store blob data"));

        await failingStorage.storeBlob(env.CHAIN_ID, BLOB_HASH, HEX_DATA);
      },
      BlobStorageError,
      {
        checkCause: true,
      }
    );
  });

  describe("getBlob", () => {
    it("should fetch the blob data by a given versioned hash correctly", async () => {
      await storage.storeBlob(env.CHAIN_ID, BLOB_HASH, HEX_DATA);

      const result = await storage.getBlob(BLOB_HASH);

      expect(result).toBe(HEX_DATA);
    });

    testValidError(
      "should throw a valid error if no blob data has been found",
      async () => {
        const prisma = storage.getClient();

        vi.spyOn(prisma.blobData, "findFirstOrThrow").mockRejectedValueOnce(
          new Error("Blob data not found")
        );

        await storage.getBlob(BLOB_HASH);
      },
      BlobStorageError,
      { checkCause: true }
    );
  });

  describe("tryGetConfigFromEnv", () => {
    it("should return a valid config object ", () => {
      expect(PostgresStorage.getConfigFromEnv({})).toEqual({});
    });
  });
});
