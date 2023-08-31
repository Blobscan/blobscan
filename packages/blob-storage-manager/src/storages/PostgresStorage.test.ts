import { beforeAll, describe, expect, it } from "vitest";

import prisma from "@blobscan/db/prisma/__mocks__/client";

import { BLOB_HASH, CHAIN_ID, HEX_DATA } from "../../test/fixtures";
import { PostgresStorageMock as PostgresStorage } from "../__mocks__/PostgresStorage";

describe("PostgresStorage", () => {
  let storage: PostgresStorage;

  beforeAll(() => {
    storage = new PostgresStorage();
  });

  describe("healthCheck", () => {
    it("should resolve successfully", async () => {
      await expect(storage.healthCheck()).resolves.not.toThrow();
    });
  });

  describe("getBlob", () => {
    it("should fetch the blob data and convert to hex", async () => {
      const result = await storage.getBlob(BLOB_HASH);

      expect(result).toBe(HEX_DATA);
    });

    it("should throw if blob data is not found", async () => {
      prisma.blobData.findFirstOrThrow.mockRejectedValueOnce(
        new Error("Blob data not found")
      );

      await expect(storage.getBlob(BLOB_HASH)).rejects.toMatchInlineSnapshot(
        "[Error: Blob data not found]"
      );
    });
  });

  describe("storeBlob", () => {
    it("should store the blob data and return versionedHash", async () => {
      const result = await storage.storeBlob(CHAIN_ID, BLOB_HASH, HEX_DATA);

      expect(result).toBe(BLOB_HASH);
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
