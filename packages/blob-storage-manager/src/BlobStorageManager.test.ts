import { describe, expect, it } from "vitest";

import prisma from "@blobscan/db/prisma/__mocks__/client";

import {
  BLOB_DATA,
  BLOB_HASH,
  CHAIN_ID,
  FILE_URI,
  GOOGLE_STORAGE_CONFIG,
  SWARM_REFERENCE,
  SWARM_STORAGE_CONFIG,
} from "../test/constants";
import { BlobStorageManager } from "./BlobStorageManager";
import {
  GoogleStorageMock as GoogleStorage,
  PostgresStorageMock as PostgresStorage,
  SwarmStorageMock as SwarmStorage,
} from "./__mocks__";

describe("BlobStorageManager", () => {
  const postgresStorage = new PostgresStorage();
  const googleStorage = new GoogleStorage(GOOGLE_STORAGE_CONFIG);
  const swarmStorage = new SwarmStorage(SWARM_STORAGE_CONFIG);

  const blobStorageManager = new BlobStorageManager(
    {
      POSTGRES: postgresStorage,
      GOOGLE: googleStorage,
      SWARM: swarmStorage,
    },
    CHAIN_ID
  );

  describe("constructor", () => {
    it("should throw an error if no blob storages are provided", () => {
      expect(() => new BlobStorageManager({}, CHAIN_ID)).toThrow(
        "No blob storages provided"
      );
    });

    it("should return the correct chain id", async () => {
      expect(blobStorageManager.chainId).toBe(CHAIN_ID);
    });
  });

  describe("getStorage", () => {
    it("should return the correct blob storage for a given name", async () => {
      expect(blobStorageManager.getStorage("POSTGRES")).toEqual(
        postgresStorage
      );
      expect(blobStorageManager.getStorage("GOOGLE")).toEqual(googleStorage);
      expect(blobStorageManager.getStorage("SWARM")).toEqual(swarmStorage);
    });
  });

  describe("getBlob", async () => {
    it("should return the blob data and storage name", async () => {
      const result = await blobStorageManager.getBlob(
        {
          reference: BLOB_HASH,
          storage: "POSTGRES",
        },
        {
          reference: FILE_URI,
          storage: "GOOGLE",
        },
        {
          reference: SWARM_REFERENCE,
          storage: "SWARM",
        }
      );

      expect([
        { data: "0x6d6f636b2d64617461", storage: "POSTGRES" },
        { data: "mock-data", storage: "GOOGLE" },
        { data: "mock-data", storage: "SWARM" },
      ]).toContainEqual(result);
    });

    it("should throw an error if the blob storage is not found", async () => {
      const UNKNOWN_BLOB_HASH = "0x6d6f636b2d64617461";
      const UNKNOWN_FILE_URI = "1/6d/6f/636b2d64617461.txt";
      const UNKNOWN_SWARM_REFERENCE = "123456789abcdef";

      prisma.blobData.findFirstOrThrow.mockRejectedValueOnce(
        new Error("Blob data not found")
      );

      const result = blobStorageManager.getBlob(
        {
          reference: UNKNOWN_BLOB_HASH,
          storage: "POSTGRES",
        },
        {
          reference: UNKNOWN_FILE_URI,
          storage: "GOOGLE",
        },
        {
          reference: UNKNOWN_SWARM_REFERENCE,
          storage: "SWARM",
        }
      );

      await expect(result).rejects.toThrow(
        "Failed to get blob from any of the storages: POSTGRES - Error: Blob data not found, GOOGLE - Error: File not found, SWARM - Error: File not found"
      );
    });
  });

  describe("storeBlob", () => {
    it("should store the blob in all available storages", async () => {
      const blob = { data: BLOB_DATA, versionedHash: BLOB_HASH };

      const result = await blobStorageManager.storeBlob(blob);

      expect(result.references).toEqual([
        { reference: BLOB_HASH, storage: "POSTGRES" },
        { reference: FILE_URI, storage: "GOOGLE" },
        { reference: SWARM_REFERENCE, storage: "SWARM" },
      ]);
      expect(result.errors).toEqual([]);
    });

    it("should return errors for failed uploads", async () => {
      const newHash = "0x6d6f636b2d64617461";
      const newFileUri = "7011893058/6d/6f/63/6d6f636b2d64617461.txt";
      const blob = { data: "New data", versionedHash: newHash };

      prisma.blobData.upsert.mockRejectedValueOnce(
        new Error("Blob data not found")
      );

      const result = await blobStorageManager.storeBlob(blob);

      expect(result.references).toEqual([
        { reference: newFileUri, storage: "GOOGLE" },
        { reference: SWARM_REFERENCE, storage: "SWARM" },
      ]);
      expect(result.errors).toEqual([
        { error: new Error("Blob data not found"), storage: "POSTGRES" },
      ]);
    });

    it("should throw an error if all uploads fail", async () => {
      const newBlobStorageManager = new BlobStorageManager(
        {
          POSTGRES: postgresStorage,
        },
        CHAIN_ID
      );

      prisma.blobData.upsert.mockRejectedValueOnce(
        new Error("Blob data not found")
      );

      const blob = { data: "New data", versionedHash: "0x6d6f636b2d64617461" };
      await expect(newBlobStorageManager.storeBlob(blob)).rejects.toThrow(
        "Failed to upload blob 0x6d6f636b2d64617461 to any of the storages: POSTGRES: Error: Blob data not found"
      );
    });
  });
});
